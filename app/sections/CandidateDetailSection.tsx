'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiAlertCircle, FiMessageSquare, FiUser, FiFileText, FiStar } from 'react-icons/fi'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
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

interface CandidateDetailProps {
  candidate: Candidate
  job: Job
  onBack: () => void
  onUpdateCandidate: (jobId: string, candidateId: string, updates: Partial<Candidate>) => void
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

const INTERVIEW_AGENT_ID = '69a295bf42fb78f6798a6c1d'
const EVALUATOR_AGENT_ID = '69a295d20082f39a3a37ce52'

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#3b82f6' : score >= 40 ? '#eab308' : '#ef4444'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" />
      </svg>
      <span className="absolute text-sm font-bold">{score}</span>
    </div>
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

const recBadgeColor = (rec: string) => {
  const r = rec?.toLowerCase() || ''
  if (r.includes('strong hire') || r === 'recommended') return 'bg-green-100 text-green-700'
  if (r === 'hire') return 'bg-blue-100 text-blue-700'
  if (r === 'maybe') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function CandidateDetailSection({ candidate, job, onBack, onUpdateCandidate, activeAgentId, setActiveAgentId }: CandidateDetailProps) {
  const [tab, setTab] = useState('profile')
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [evaluationLoading, setEvaluationLoading] = useState(false)
  const [error, setError] = useState('')

  const sr = candidate.screeningResult
  const ir = candidate.interviewResult
  const er = candidate.evaluationResult

  const handleInterview = async () => {
    setInterviewLoading(true)
    setError('')
    setActiveAgentId(INTERVIEW_AGENT_ID)
    onUpdateCandidate(job.id, candidate.id, { stage: 'interview' })
    try {
      const message = JSON.stringify({
        job_title: job.title, job_description: job.description, requirements: job.requirements,
        candidate_name: candidate.name, resume_text: candidate.resumeText,
        screening_summary: sr?.summary || '',
      })
      const result = await callAIAgent(message, INTERVIEW_AGENT_ID)
      const data = parseAgentResponse(result)
      if (data) {
        onUpdateCandidate(job.id, candidate.id, { interviewResult: data, stage: 'interviewed' })
      } else {
        setError('Failed to parse interview results')
        onUpdateCandidate(job.id, candidate.id, { stage: 'screened' })
      }
    } catch {
      setError('Interview agent failed. Please try again.')
      onUpdateCandidate(job.id, candidate.id, { stage: 'screened' })
    }
    setInterviewLoading(false)
    setActiveAgentId(null)
  }

  const handleEvaluate = async () => {
    setEvaluationLoading(true)
    setError('')
    setActiveAgentId(EVALUATOR_AGENT_ID)
    onUpdateCandidate(job.id, candidate.id, { stage: 'evaluation' })
    try {
      const message = JSON.stringify({
        job_title: job.title, job_description: job.description, requirements: job.requirements,
        candidate_name: candidate.name, resume_text: candidate.resumeText,
        interview_transcript: JSON.stringify(ir?.transcript || []),
        screening_data: JSON.stringify(sr || {}),
      })
      const result = await callAIAgent(message, EVALUATOR_AGENT_ID)
      const data = parseAgentResponse(result)
      if (data) {
        onUpdateCandidate(job.id, candidate.id, { evaluationResult: data, stage: 'evaluated' })
      } else {
        setError('Failed to parse evaluation results')
        onUpdateCandidate(job.id, candidate.id, { stage: 'interviewed' })
      }
    } catch {
      setError('Evaluation agent failed. Please try again.')
      onUpdateCandidate(job.id, candidate.id, { stage: 'interviewed' })
    }
    setEvaluationLoading(false)
    setActiveAgentId(null)
  }

  const radarData = er?.category_scores ? [
    { category: 'Technical', value: er.category_scores.technical_skills ?? 0 },
    { category: 'Communication', value: er.category_scores.communication ?? 0 },
    { category: 'Experience', value: er.category_scores.experience_relevance ?? 0 },
    { category: 'Culture Fit', value: er.category_scores.culture_fit ?? 0 },
    { category: 'Problem Solving', value: er.category_scores.problem_solving ?? 0 },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><FiArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">{job.title} -- {job.department}</p>
        </div>
        {sr && <ScoreGauge score={sr.overall_score ?? 0} size={56} />}
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 flex items-center gap-2">
            <FiAlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile"><FiFileText className="mr-1.5 h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="interview"><FiMessageSquare className="mr-1.5 h-3.5 w-3.5" /> Interview</TabsTrigger>
          <TabsTrigger value="evaluation"><FiStar className="mr-1.5 h-3.5 w-3.5" /> Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
            <CardHeader><CardTitle className="text-sm">Resume</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{candidate.resumeText || 'No resume text available'}</p>
              </ScrollArea>
            </CardContent>
          </Card>

          {sr ? (
            <>
              <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Screening Results</CardTitle>
                    <Badge className={`${recBadgeColor(sr.recommendation)}`}>{sr.recommendation ?? 'N/A'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted/40 rounded-xl">
                      <p className="text-2xl font-bold">{sr.overall_score ?? '--'}</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl">
                      <p className="text-2xl font-bold">{sr.experience_years ?? '--'}</p>
                      <p className="text-xs text-muted-foreground">Yrs Exp.</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl">
                      <p className="text-sm font-medium truncate">{sr.education ?? '--'}</p>
                      <p className="text-xs text-muted-foreground">Education</p>
                    </div>
                  </div>

                  {sr.summary && <div className="pt-2">{renderMarkdown(sr.summary)}</div>}

                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Skills Matched</h4>
                    <div className="space-y-2">
                      {Array.isArray(sr.skills_matched) && sr.skills_matched.map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FiCheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-sm font-medium">{s?.skill ?? ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{s?.match_level ?? ''}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {Array.isArray(sr.skills_missing) && sr.skills_missing.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Missing Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {sr.skills_missing.map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-red-50 text-red-600 text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(sr.top_strengths) && sr.top_strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Top Strengths</h4>
                      <ul className="space-y-1">
                        {sr.top_strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm"><FiCheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(sr.concerns) && sr.concerns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Concerns</h4>
                      <ul className="space-y-1">
                        {sr.concerns.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm"><FiAlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardContent className="py-8 text-center">
                <FiFileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No screening results yet</p>
                <p className="text-xs text-muted-foreground mt-1">Run resume screening from the candidates list</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interview" className="space-y-4 mt-4">
          {interviewLoading ? (
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardContent className="py-8 space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm font-medium">Conducting interview...</p>
                </div>
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
                <Skeleton className="h-4 w-2/3 mx-auto" />
              </CardContent>
            </Card>
          ) : ir ? (
            <>
              <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Interview Summary</CardTitle>
                    <Badge variant="secondary">{ir.interview_status ?? 'Completed'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/40 rounded-xl text-center">
                      <p className="text-xl font-bold">{ir.questions_asked ?? '--'}</p>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl text-center">
                      <p className="text-xl font-bold">{ir.interview_duration_minutes ?? '--'}</p>
                      <p className="text-xs text-muted-foreground">Minutes</p>
                    </div>
                  </div>
                  {ir.overall_impression && <div className="pt-2">{renderMarkdown(ir.overall_impression)}</div>}
                </CardContent>
              </Card>

              <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                <CardHeader><CardTitle className="text-sm">Transcript</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {Array.isArray(ir.transcript) && ir.transcript.map((entry: any, i: number) => {
                        const isInterviewer = (entry?.speaker ?? '').toLowerCase().includes('interview')
                        return (
                          <div key={i} className={`flex ${isInterviewer ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isInterviewer ? 'bg-muted/60 rounded-bl-sm' : 'bg-primary text-primary-foreground rounded-br-sm'}`}>
                              <p className="text-xs font-semibold mb-1 opacity-70">{entry?.speaker ?? 'Unknown'}{entry?.question_category ? ` -- ${entry.question_category}` : ''}</p>
                              <p>{entry?.message ?? ''}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader><CardTitle className="text-xs">Topics Covered</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(ir.key_topics_covered) && ir.key_topics_covered.map((t: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader><CardTitle className="text-xs">Highlights</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {Array.isArray(ir.candidate_highlights) && ir.candidate_highlights.map((h: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs"><FiCheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />{h}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader><CardTitle className="text-xs">Concerns</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {Array.isArray(ir.areas_of_concern) && ir.areas_of_concern.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs"><FiAlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />{c}</li>
                      ))}
                      {(!Array.isArray(ir.areas_of_concern) || ir.areas_of_concern.length === 0) && <p className="text-xs text-muted-foreground">None noted</p>}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardContent className="py-12 text-center">
                <FiMessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-medium text-sm mb-1">Ready to interview</p>
                <p className="text-xs text-muted-foreground mb-4">The AI will conduct a structured interview based on the job requirements</p>
                <Button onClick={handleInterview} disabled={!sr}>
                  <FiMessageSquare className="mr-2 h-4 w-4" /> Start Interview
                </Button>
                {!sr && <p className="text-xs text-muted-foreground mt-2">Screen the candidate first</p>}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4 mt-4">
          {evaluationLoading ? (
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardContent className="py-8 space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm font-medium">Generating evaluation...</p>
                </div>
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </CardContent>
            </Card>
          ) : er ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Overall Assessment</CardTitle>
                      <Badge className={recBadgeColor(er.recommendation ?? '')}>{er.recommendation ?? 'N/A'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <ScoreGauge score={er.overall_score ?? 0} size={100} />
                    <p className="text-sm font-medium mt-2">Overall Score</p>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader><CardTitle className="text-sm">Category Scores</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                <CardHeader><CardTitle className="text-sm">Detailed Evaluation</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {er.detailed_evaluation && renderMarkdown(er.detailed_evaluation)}
                  {er.interview_performance_summary && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Interview Performance</h4>
                      {renderMarkdown(er.interview_performance_summary)}
                    </div>
                  )}
                  {er.resume_alignment_notes && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Resume Alignment</h4>
                      {renderMarkdown(er.resume_alignment_notes)}
                    </div>
                  )}
                  {er.hiring_justification && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Hiring Justification</h4>
                      {renderMarkdown(er.hiring_justification)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader><CardTitle className="text-xs">Strengths</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {Array.isArray(er.strengths) && er.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs"><FiCheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />{s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader><CardTitle className="text-xs">Areas for Development</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {Array.isArray(er.areas_for_development) && er.areas_for_development.map((a: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs"><FiAlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />{a}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader><CardTitle className="text-xs">Red Flags</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {Array.isArray(er.red_flags) && er.red_flags.length > 0 ? er.red_flags.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs"><FiXCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />{r}</li>
                      )) : <p className="text-xs text-muted-foreground">No red flags identified</p>}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardContent className="py-12 text-center">
                <FiStar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-medium text-sm mb-1">Ready to evaluate</p>
                <p className="text-xs text-muted-foreground mb-4">Generate a comprehensive hiring evaluation based on screening and interview</p>
                <Button onClick={handleEvaluate} disabled={!ir}>
                  <FiStar className="mr-2 h-4 w-4" /> Evaluate Candidate
                </Button>
                {!ir && <p className="text-xs text-muted-foreground mt-2">Complete the interview first</p>}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
