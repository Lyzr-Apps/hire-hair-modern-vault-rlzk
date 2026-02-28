'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { FiArrowLeft, FiUpload, FiCheckCircle, FiUsers, FiFileText, FiStar, FiXCircle, FiAlertCircle } from 'react-icons/fi'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'

interface Candidate {
  id: string; name: string; email: string; resumeText: string; resumeFileName: string
  screeningResult: any; interviewResult: any; evaluationResult: any; stage: string; shortlisted: boolean
}

interface Job {
  id: string; title: string; department: string; description: string; requirements: string[]
  status: string; createdAt: string; candidates: Candidate[]
}

interface CandidatesProps {
  job: Job
  onBack: () => void
  onUpdateCandidate: (jobId: string, candidateId: string, updates: Partial<Candidate>) => void
  onAddCandidate: (jobId: string, candidate: Omit<Candidate, 'id'>) => void
  onSelectCandidate: (candidate: Candidate) => void
  activeAgentId: string | null
  setActiveAgentId: (id: string | null) => void
}

function parseAgentResponse(result: any): any {
  if (!result?.success) return null
  let data = result?.response?.result
  if (!data) return null
  if (typeof data === 'string') {
    try { data = parseLLMJson(data) } catch { return null }
  }
  return data
}

const SCREENING_AGENT_ID = '69a295bfbb857be96e3e20e3'

function stageBadge(stage: string) {
  const colors: Record<string, string> = {
    new: 'bg-secondary text-secondary-foreground',
    screening: 'bg-blue-100 text-blue-700',
    screened: 'bg-blue-100 text-blue-700',
    interview: 'bg-purple-100 text-purple-700',
    interviewed: 'bg-purple-100 text-purple-700',
    evaluation: 'bg-amber-100 text-amber-700',
    evaluated: 'bg-amber-100 text-amber-700',
    hired: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return colors[stage] || 'bg-secondary text-secondary-foreground'
}

export default function CandidatesSection({ job, onBack, onUpdateCandidate, onAddCandidate, onSelectCandidate, activeAgentId, setActiveAgentId }: CandidatesProps) {
  const [screening, setScreening] = useState(false)
  const [screeningProgress, setScreeningProgress] = useState(0)
  const [filter, setFilter] = useState('all')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const candidates = Array.isArray(job.candidates) ? job.candidates : []

  const filteredCandidates = candidates.filter(c => {
    if (filter === 'all') return true
    if (filter === 'shortlisted') return c.shortlisted
    if (filter === 'interviewed') return c.interviewResult != null
    if (filter === 'evaluated') return c.evaluationResult != null
    return true
  })

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string || `Resume content from ${file.name}`
        const nameParts = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').split(' ')
        const name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
        onAddCandidate(job.id, {
          name,
          email: `${name.toLowerCase().replace(/\s/g, '.')}@email.com`,
          resumeText: text,
          resumeFileName: file.name,
          screeningResult: null,
          interviewResult: null,
          evaluationResult: null,
          stage: 'new',
          shortlisted: false,
        })
      }
      reader.readAsText(file)
    })
  }, [job.id, onAddCandidate])

  const handleScreenAll = async () => {
    const unscreened = candidates.filter(c => !c.screeningResult)
    if (unscreened.length === 0) return
    setScreening(true)
    setScreeningProgress(0)
    setActiveAgentId(SCREENING_AGENT_ID)

    for (let i = 0; i < unscreened.length; i++) {
      const c = unscreened[i]
      onUpdateCandidate(job.id, c.id, { stage: 'screening' })
      try {
        const message = JSON.stringify({
          job_title: job.title,
          job_description: job.description,
          requirements: job.requirements,
          resume_text: c.resumeText,
          candidate_name: c.name,
        })
        const result = await callAIAgent(message, SCREENING_AGENT_ID)
        const data = parseAgentResponse(result)
        if (data) {
          onUpdateCandidate(job.id, c.id, {
            screeningResult: data,
            stage: 'screened',
            shortlisted: data.recommendation === 'Recommended',
          })
        } else {
          onUpdateCandidate(job.id, c.id, { stage: 'screened' })
        }
      } catch {
        onUpdateCandidate(job.id, c.id, { stage: 'new' })
      }
      setScreeningProgress(Math.round(((i + 1) / unscreened.length) * 100))
    }
    setScreening(false)
    setActiveAgentId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><FiArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.department} -- {candidates.length} candidates</p>
        </div>
      </div>

      {/* Upload Zone */}
      <Card className={`backdrop-blur-[16px] bg-card/75 border-2 border-dashed transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}`}>
        <CardContent className="p-6">
          <div
            className="flex flex-col items-center justify-center py-4 cursor-pointer"
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Drop resumes here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Supports PDF and DOCX files</p>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={e => handleFileUpload(e.target.files)} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'shortlisted', 'interviewed', 'evaluated'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs">
              {f}
            </Button>
          ))}
        </div>
        <Button onClick={handleScreenAll} disabled={screening || candidates.filter(c => !c.screeningResult).length === 0}>
          {screening ? (
            <>Screening... {screeningProgress}%</>
          ) : (
            <><FiStar className="mr-2 h-4 w-4" /> Screen Resumes</>
          )}
        </Button>
      </div>

      {screening && <Progress value={screeningProgress} className="h-2" />}

      {/* Table */}
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-16">
          <FiUsers className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No candidates yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload resumes to get started</p>
        </div>
      ) : (
        <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Screening Score</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Interview</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Evaluation</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Stage</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(c => (
                  <tr key={c.id} className="border-b last:border-b-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.resumeFileName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.stage === 'screening' ? (
                        <Skeleton className="h-4 w-20" />
                      ) : c.screeningResult ? (
                        <div className="flex items-center gap-2">
                          <Progress value={c.screeningResult.overall_score} className="w-16 h-2" />
                          <span className="text-xs font-medium">{c.screeningResult.overall_score}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.interviewResult ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px]"><FiCheckCircle className="mr-1 h-3 w-3" />Done</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.evaluationResult ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">{c.evaluationResult.overall_score}</span>
                          <span className="text-[10px] text-muted-foreground">/100</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] capitalize ${stageBadge(c.stage)}`}>{c.stage}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => onSelectCandidate(c)}>
                        View <FiArrowLeft className="ml-1 h-3 w-3 rotate-180" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
