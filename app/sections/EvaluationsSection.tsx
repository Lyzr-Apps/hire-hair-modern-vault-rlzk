'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FiBarChart2, FiTrendingUp, FiCheckCircle, FiXCircle } from 'react-icons/fi'

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

interface EvaluationsProps {
  jobs: Job[]
  onUpdateCandidate: (jobId: string, candidateId: string, updates: Partial<Candidate>) => void
  onSelectCandidate: (candidate: Candidate, jobId: string) => void
}

function scoreColorClass(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-700'
  if (score >= 60) return 'bg-blue-100 text-blue-700'
  if (score >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

function scoreBg(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

const recBadgeColor = (rec: string) => {
  const r = (rec ?? '').toLowerCase()
  if (r.includes('strong hire')) return 'bg-green-100 text-green-700'
  if (r === 'hire') return 'bg-blue-100 text-blue-700'
  if (r === 'maybe') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function EvaluationsSection({ jobs, onUpdateCandidate, onSelectCandidate }: EvaluationsProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>('all')

  const evaluatedCandidates = useMemo(() => {
    const candidates: { candidate: Candidate; jobId: string; jobTitle: string }[] = []
    const filteredJobs = selectedJobId === 'all' ? jobs : jobs.filter(j => j.id === selectedJobId)
    filteredJobs.forEach(job => {
      const jobCandidates = Array.isArray(job.candidates) ? job.candidates : []
      jobCandidates.forEach(c => {
        if (c.evaluationResult) {
          candidates.push({ candidate: c, jobId: job.id, jobTitle: job.title })
        }
      })
    })
    candidates.sort((a, b) => (b.candidate.evaluationResult?.overall_score ?? 0) - (a.candidate.evaluationResult?.overall_score ?? 0))
    return candidates
  }, [jobs, selectedJobId])

  const categoryLabels: Record<string, string> = {
    technical_skills: 'Technical',
    communication: 'Communication',
    experience_relevance: 'Experience',
    culture_fit: 'Culture Fit',
    problem_solving: 'Problem Solving',
  }

  const handleStageUpdate = (jobId: string, candidateId: string, newStage: string) => {
    onUpdateCandidate(jobId, candidateId, { stage: newStage })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evaluations</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare candidates and make hiring decisions</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filter by job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Job Postings</SelectItem>
            {jobs.map(j => (
              <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{evaluatedCandidates.length} evaluated</Badge>
      </div>

      {evaluatedCandidates.length === 0 ? (
        <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FiBarChart2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No evaluations yet</p>
            <p className="text-sm text-muted-foreground mt-1">Complete candidate evaluations to see comparisons here</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
            <CardHeader><CardTitle className="text-sm">Candidate Rankings</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluatedCandidates.map(({ candidate, jobId, jobTitle }, idx) => {
                  const er = candidate.evaluationResult
                  const overallScore = er?.overall_score ?? 0
                  return (
                    <div key={candidate.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onSelectCandidate(candidate, jobId)}>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{candidate.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${recBadgeColor(er?.recommendation ?? '')}`}>{er?.recommendation ?? 'N/A'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{jobTitle}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${overallScore >= 80 ? 'text-green-600' : overallScore >= 60 ? 'text-blue-600' : overallScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{overallScore}</p>
                          <p className="text-xs text-muted-foreground">/ 100</p>
                        </div>
                        <Select value={candidate.stage} onValueChange={(val) => handleStageUpdate(jobId, candidate.id, val)}>
                          <SelectTrigger className="w-[120px] h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="evaluated">Evaluated</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md overflow-hidden">
            <CardHeader><CardTitle className="text-sm">Comparison Table</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground sticky left-0 bg-card/90 backdrop-blur-sm">Candidate</th>
                        <th className="text-center py-3 px-3 font-medium text-muted-foreground">Overall</th>
                        {Object.values(categoryLabels).map(label => (
                          <th key={label} className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">{label}</th>
                        ))}
                        <th className="text-center py-3 px-3 font-medium text-muted-foreground">Rec.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluatedCandidates.map(({ candidate }) => {
                        const er = candidate.evaluationResult
                        const cs = er?.category_scores
                        return (
                          <tr key={candidate.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="py-3 px-4 font-medium sticky left-0 bg-card/90 backdrop-blur-sm">{candidate.name}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center justify-center w-10 h-7 rounded-md text-xs font-bold ${scoreColorClass(er?.overall_score ?? 0)}`}>{er?.overall_score ?? '--'}</span>
                            </td>
                            {Object.keys(categoryLabels).map(key => {
                              const val = cs?.[key] ?? 0
                              return (
                                <td key={key} className="py-3 px-3 text-center">
                                  <span className={`inline-flex items-center justify-center w-10 h-7 rounded-md text-xs font-bold ${scoreColorClass(val)}`}>{val}</span>
                                </td>
                              )
                            })}
                            <td className="py-3 px-3 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${recBadgeColor(er?.recommendation ?? '')}`}>{er?.recommendation ?? 'N/A'}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
