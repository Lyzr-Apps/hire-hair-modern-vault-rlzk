'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FiArrowLeft, FiUpload, FiCheckCircle, FiUsers, FiFileText, FiStar, FiXCircle, FiAlertCircle } from 'react-icons/fi'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'

interface Candidate {
  id: string
  name: string
  email: string
  resumeText: string
  resumeFileName: string
  screeningResult: any
  interviewResult: any
  evaluationResult: any
  stage: string
  shortlisted: boolean
}

interface Job {
  id: string
  title: string
  department: string
  description: string
  requirements: string[]
  status: string
  createdAt: string
  candidates: Candidate[]
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

const stageLabel: Record<string, string> = {
  new: 'New', screening: 'Screening', screened: 'Screened',
  interview: 'Interview', interviewed: 'Interviewed',
  evaluation: 'Evaluation', evaluated: 'Evaluated',
  hired: 'Hired', rejected: 'Rejected'
}

const stageColor: Record<string, string> = {
  new: 'bg-secondary text-secondary-foreground',
  screening: 'bg-blue-100 text-blue-700', screened: 'bg-blue-100 text-blue-700',
  interview: 'bg-purple-100 text-purple-700', interviewed: 'bg-purple-100 text-purple-700',
  evaluation: 'bg-amber-100 text-amber-700', evaluated: 'bg-amber-100 text-amber-700',
  hired: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700'
}

export default function CandidatesSection({ job, onBack, onUpdateCandidate, onAddCandidate, onSelectCandidate, activeAgentId, setActiveAgentId }: CandidatesProps) {
  const [filter, setFilter] = useState('all')
  const [screening, setScreening] = useState(false)
  const [screeningProgress, setScreeningProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const candidates = Array.isArray(job.candidates) ? job.candidates : []

  const filteredCandidates = candidates.filter(c => {
    if (filter === 'all') return true
    if (filter === 'shortlisted') return c.shortlisted
    if (filter === 'interviewed') return c.stage === 'interviewed' || c.stage === 'evaluation' || c.stage === 'evaluated'
    if (filter === 'evaluated') return c.stage === 'evaluated'
    return true
  })

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string || ''
        onAddCandidate(job.id, {
          name: file.name.replace(/\.(pdf|docx|txt)$/i, '').replace(/[_-]/g, ' '),
          email: '',
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
    const unscreened = candidates.filter(c => c.stage === 'new')
    if (unscreened.length === 0) return
    setScreening(true)
    setActiveAgentId(SCREENING_AGENT_ID)
    setScreeningProgress(0)

    for (let i = 0; i < unscreened.length; i++) {
      const c = unscreened[i]
      onUpdateCandidate(job.id, c.id, { stage: 'screening' })
      try {
        const message = JSON.stringify({
          job_title: job.title,
          job_description: job.description,
          requirements: job.requirements,
          resume_text: c.resumeText,
        })
        const result = await callAIAgent(message, SCREENING_AGENT_ID)
        const data = parseAgentResponse(result)
        if (data) {
          const score = data?.overall_score ?? 0
          onUpdateCandidate(job.id, c.id, {
            screeningResult: data,
            stage: 'screened',
            shortlisted: score >= 70,
            name: data?.candidate_name || c.name,
          })
        } else {
          onUpdateCandidate(job.id, c.id, { stage: 'screened' })
        }
      } catch {
        onUpdateCandidate(job.id, c.id, { stage: 'screened' })
      }
      setScreeningProgress(Math.round(((i + 1) / unscreened.length) * 100))
    }
    setScreening(false)
    setActiveAgentId(null)
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  const recBadge = (rec: string) => {
    if (rec === 'Recommended') return 'bg-green-100 text-green-700'
    if (rec === 'Maybe') return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  const newCount = candidates.filter(c => c.stage === 'new').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <FiArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.department} -- {candidates.length} candidates</p>
        </div>
        <Button onClick={handleScreenAll} disabled={screening || newCount === 0} variant={newCount > 0 ? 'default' : 'secondary'}>
          {screening ? (
            <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent inline-block" /> Screening...</>
          ) : (
            <><FiCheckCircle className="mr-2 h-4 w-4" /> Screen Resumes ({newCount})</>
          )}
        </Button>
      </div>

      {screening && (
        <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Screening resumes...</p>
              <span className="text-sm text-muted-foreground">{screeningProgress}%</span>
            </div>
            <Progress value={screeningProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files) }}>
        <CardContent className={`py-8 text-center border-2 border-dashed rounded-xl transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border/60'}`}>
          <FiUpload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-2">Drag and drop resumes here, or click to browse</p>
          <p className="text-xs text-muted-foreground mb-3">Accepts .pdf, .docx, .txt files</p>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <FiUpload className="mr-2 h-3.5 w-3.5" /> Browse Files
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({candidates.length})</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted ({candidates.filter(c => c.shortlisted).length})</TabsTrigger>
          <TabsTrigger value="interviewed">Interviewed ({candidates.filter(c => c.stage === 'interviewed' || c.stage === 'evaluation' || c.stage === 'evaluated').length})</TabsTrigger>
          <TabsTrigger value="evaluated">Evaluated ({candidates.filter(c => c.stage === 'evaluated').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredCandidates.length === 0 ? (
        <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FiUsers className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm">No candidates in this filter</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Screening</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Interview</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Evaluation</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Stage</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(c => {
                  const screenScore = c.screeningResult?.overall_score
                  const evalScore = c.evaluationResult?.overall_score
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => onSelectCandidate(c)}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {c.shortlisted && <FiStar className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                          <div>
                            <p className="font-medium">{c.name}</p>
                            {c.resumeFileName && <p className="text-xs text-muted-foreground">{c.resumeFileName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {c.stage === 'screening' ? (
                          <Skeleton className="h-4 w-16" />
                        ) : screenScore != null ? (
                          <div className="flex items-center gap-2">
                            <Progress value={screenScore} className="h-2 w-16" />
                            <span className={`text-xs font-semibold ${scoreColor(screenScore)}`}>{screenScore}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {c.interviewResult ? (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Complete</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {evalScore != null ? (
                          <span className={`text-sm font-semibold ${scoreColor(evalScore)}`}>{evalScore}/100</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColor[c.stage] || 'bg-secondary text-secondary-foreground'}`}>
                          {stageLabel[c.stage] || c.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onSelectCandidate(c) }}>
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
