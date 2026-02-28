'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FiBarChart2, FiUser } from 'react-icons/fi'

interface Candidate {
  id: string; name: string; email: string; resumeText: string; resumeFileName: string
  screeningResult: any; interviewResult: any; evaluationResult: any; stage: string; shortlisted: boolean
}

interface Job {
  id: string; title: string; department: string; description: string; requirements: string[]
  status: 'active' | 'closed' | 'draft'; createdAt: string; candidates: Candidate[]
}

interface Props {
  jobs: Job[]
  onUpdateCandidate: (jobId: string, candidateId: string, updates: Partial<Candidate>) => void
  onSelectCandidate: (candidate: Candidate, jobId: string) => void
}

function scoreColor(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-blue-100 text-blue-800'
  if (score >= 40) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

function recBadge(rec: string) {
  if (rec === 'Strong Hire') return 'bg-green-100 text-green-800'
  if (rec === 'Hire') return 'bg-blue-100 text-blue-800'
  if (rec === 'Maybe') return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

export default function EvaluationsSection({ jobs, onUpdateCandidate, onSelectCandidate }: Props) {
  const [selectedJobId, setSelectedJobId] = useState<string>('all')

  const jobsWithEval = jobs.filter(j => {
    const candidates = Array.isArray(j.candidates) ? j.candidates : []
    return candidates.some(c => c.evaluationResult)
  })

  const filteredJobs = selectedJobId === 'all' ? jobs : jobs.filter(j => j.id === selectedJobId)
  const evaluatedCandidates = filteredJobs.flatMap(j => {
    const candidates = Array.isArray(j.candidates) ? j.candidates : []
    return candidates.filter(c => c.evaluationResult).map(c => ({ ...c, jobId: j.id, jobTitle: j.title }))
  }).sort((a, b) => (b.evaluationResult?.overall_score || 0) - (a.evaluationResult?.overall_score || 0))

  const categories = ['technical_skills', 'communication', 'experience_relevance', 'culture_fit', 'problem_solving']
  const categoryLabels: Record<string, string> = {
    technical_skills: 'Technical',
    communication: 'Communication',
    experience_relevance: 'Experience',
    culture_fit: 'Culture Fit',
    problem_solving: 'Problem Solving',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evaluations</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare evaluated candidates</p>
        </div>
        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by job" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Job Postings</SelectItem>
            {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {evaluatedCandidates.length === 0 ? (
        <div className="text-center py-16">
          <FiBarChart2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No evaluated candidates yet</p>
          <p className="text-xs text-muted-foreground mt-1">Complete interviews and evaluations to see results here</p>
        </div>
      ) : (
        <>
          {/* Comparison Table */}
          <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm">Score Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Rank</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Candidate</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Job</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Overall</th>
                      {categories.map(cat => (
                        <th key={cat} className="text-center text-xs font-medium text-muted-foreground px-3 py-3">{categoryLabels[cat]}</th>
                      ))}
                      <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Recommendation</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluatedCandidates.map((c: any, idx: number) => (
                      <tr key={c.id} className="border-b last:border-b-0 hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => onSelectCandidate(c, c.jobId)}>
                        <td className="px-4 py-3 text-sm font-bold text-muted-foreground">#{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold">
                              {c.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{c.jobTitle}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`text-xs ${scoreColor(c.evaluationResult.overall_score)}`}>
                            {c.evaluationResult.overall_score}
                          </Badge>
                        </td>
                        {categories.map(cat => {
                          const score = c.evaluationResult?.category_scores?.[cat] || 0
                          return (
                            <td key={cat} className="px-3 py-3 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-[10px] font-medium ${scoreColor(score)}`}>
                                {score}
                              </span>
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-center">
                          <Badge className={`text-[10px] ${recBadge(c.evaluationResult.recommendation)}`}>
                            {c.evaluationResult.recommendation}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Select value={c.stage} onValueChange={(v) => { onUpdateCandidate(c.jobId, c.id, { stage: v }) }}>
                            <SelectTrigger className="h-7 text-[10px] w-[90px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="evaluated">Evaluated</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluatedCandidates.slice(0, 6).map((c: any, idx: number) => (
              <Card key={c.id} className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onSelectCandidate(c, c.jobId)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-secondary text-muted-foreground'}`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.jobTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{c.evaluationResult.overall_score}</p>
                      <Badge className={`text-[9px] ${recBadge(c.evaluationResult.recommendation)}`}>{c.evaluationResult.recommendation}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
