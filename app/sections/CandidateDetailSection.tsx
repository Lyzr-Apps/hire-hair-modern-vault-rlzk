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
  id: string; name: string; email: string; resumeText: string; resumeFileName: string
  screeningResult: any; interviewResult: any; evaluationResult: any; stage: string; shortlisted: boolean
}

interface Job {
  id: string; title: string; department: string; description: string; requirements: string[]
  status: string; createdAt: string; candidates: Candidate[]
}

interface Props {
  candidate: Candidate; job: Job; onBack: () => void
  onUpdateCandidate: (jobId: string, candidateId: string, updates: Partial<Candidate>) => void
  activeAgentId: string | null; setActiveAgentId: (id: string | null) => void
}

function parseAgentResponse(result: any): any {
  if (!result?.success) return null
  let data = result?.response?.result
  if (!data) return null
  if (typeof data === 'string') { try { data = parseLLMJson(data) } catch { return null } }
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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" />
      </svg>
      <span className="absolute text-sm font-bold">{score}</span>
    </div>
  )
}

function recBadge(rec: string) {
  if (rec === 'Strong Hire') return 'bg-green-100 text-green-800 border-green-200'
  if (rec === 'Hire') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (rec === 'Recommended') return 'bg-green-100 text-green-800 border-green-200'
  if (rec === 'Maybe') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export default function CandidateDetailSection({ candidate, job, onBack, onUpdateCandidate, activeAgentId, setActiveAgentId }: Props) {
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [evalLoading, setEvalLoading] = useState(false)

  const handleInterview = async () => {
    setInterviewLoading(true)
    setActiveAgentId(INTERVIEW_AGENT_ID)
    onUpdateCandidate(job.id, candidate.id, { stage: 'interview' })
    try {
      const message = JSON.stringify({
        job_title: job.title, job_description: job.description, requirements: job.requirements,
        candidate_name: candidate.name, resume_text: candidate.resumeText,
        screening_summary: candidate.screeningResult?.summary || '',
      })
      const result = await callAIAgent(message, INTERVIEW_AGENT_ID)
      const data = parseAgentResponse(result)
      if (data) {
        onUpdateCandidate(job.id, candidate.id, { interviewResult: data, stage: 'interviewed' })
      } else {
        onUpdateCandidate(job.id, candidate.id, { stage: 'screened' })
      }
    } catch { onUpdateCandidate(job.id, candidate.id, { stage: 'screened' }) }
    setInterviewLoading(false)
    setActiveAgentId(null)
  }

  const handleEvaluate = async () => {
    setEvalLoading(true)
    setActiveAgentId(EVALUATOR_AGENT_ID)
    onUpdateCandidate(job.id, candidate.id, { stage: 'evaluation' })
    try {
      const message = JSON.stringify({
        job_title: job.title, job_description: job.description, requirements: job.requirements,
        candidate_name: candidate.name, resume_text: candidate.resumeText,
        interview_transcript: JSON.stringify(candidate.interviewResult?.transcript || []),
        screening_data: JSON.stringify(candidate.screeningResult || {}),
      })
      const result = await callAIAgent(message, EVALUATOR_AGENT_ID)
      const data = parseAgentResponse(result)
      if (data) {
        onUpdateCandidate(job.id, candidate.id, { evaluationResult: data, stage: 'evaluated' })
      } else {
        onUpdateCandidate(job.id, candidate.id, { stage: 'interviewed' })
      }
    } catch { onUpdateCandidate(job.id, candidate.id, { stage: 'interviewed' }) }
    setEvalLoading(false)
    setActiveAgentId(null)
  }

  const sr = candidate.screeningResult
  const ir = candidate.interviewResult
  const er = candidate.evaluationResult

  const radarData = er?.category_scores ? [
    { subject: 'Technical', value: er.category_scores.technical_skills || 0, fullMark: 100 },
    { subject: 'Communication', value: er.category_scores.communication || 0, fullMark: 100 },
    { subject: 'Experience', value: er.category_scores.experience_relevance || 0, fullMark: 100 },
    { subject: 'Culture Fit', value: er.category_scores.culture_fit || 0, fullMark: 100 },
    { subject: 'Problem Solving', value: er.category_scores.problem_solving || 0, fullMark: 100 },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><FiArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">{job.title} -- {candidate.email}</p>
        </div>
        <Badge className={`capitalize ${candidate.stage === 'hired' ? 'bg-green-100 text-green-700' : candidate.stage === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-secondary text-secondary-foreground'}`}>
          {candidate.stage}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile"><FiFileText className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="interview"><FiMessageSquare className="mr-2 h-4 w-4" />Interview</TabsTrigger>
          <TabsTrigger value="evaluation"><FiStar className="mr-2 h-4 w-4" />Evaluation</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardHeader><CardTitle className="text-sm">Resume</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{candidate.resumeText}</p>
              </CardContent>
            </Card>
            {sr ? (
              <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Screening Results</CardTitle>
                    <Badge className={`text-xs ${recBadge(sr.recommendation)}`}>{sr.recommendation}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <ScoreGauge score={sr.overall_score || 0} />
                    <div>
                      <p className="text-sm font-medium">Overall Score</p>
                      <p className="text-xs text-muted-foreground">{sr.experience_years || 0} years experience</p>
                      <p className="text-xs text-muted-foreground">{sr.education || 'N/A'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold mb-2">Skills Match</p>
                    {Array.isArray(sr.skills_matched) && sr.skills_matched.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-xs">{s.skill}</span>
                        <Badge variant="outline" className="text-[10px]">{s.match_level}</Badge>
                      </div>
                    ))}
                  </div>
                  {Array.isArray(sr.skills_missing) && sr.skills_missing.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1">Missing Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {sr.skills_missing.map((s: string, i: number) => (
                          <Badge key={i} variant="destructive" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(sr.top_strengths) && sr.top_strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1">Top Strengths</p>
                      {sr.top_strengths.map((s: string, i: number) => (
                        <div key={i} className="flex items-center gap-1 py-0.5">
                          <FiCheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <span className="text-xs">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{sr.summary}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FiStar className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No screening results yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Screen resumes from the candidates page</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Interview Tab */}
        <TabsContent value="interview" className="mt-4 space-y-4">
          {!ir && !interviewLoading && (
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FiMessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No interview conducted yet</p>
                <Button onClick={handleInterview} disabled={!sr}>
                  <FiMessageSquare className="mr-2 h-4 w-4" /> Start Interview
                </Button>
                {!sr && <p className="text-xs text-muted-foreground mt-2">Screen the candidate first</p>}
              </CardContent>
            </Card>
          )}
          {interviewLoading && (
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardContent className="py-8 space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <p className="text-sm font-medium">Conducting interview...</p>
                </div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    <Skeleton className="h-12 flex-1 rounded-xl" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {ir && (
            <div className="space-y-4">
              <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Interview Transcript</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">{ir.questions_asked || 0} questions</Badge>
                      <Badge variant="secondary" className="text-xs">{ir.interview_duration_minutes || 0} min</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {Array.isArray(ir.transcript) && ir.transcript.map((t: any, i: number) => {
                        const isInterviewer = t.speaker?.toLowerCase().includes('interviewer') || t.speaker?.toLowerCase().includes('ai')
                        return (
                          <div key={i} className={`flex gap-3 ${isInterviewer ? '' : 'flex-row-reverse'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isInterviewer ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                              {isInterviewer ? 'AI' : candidate.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${isInterviewer ? 'bg-muted' : 'bg-primary/10'}`}>
                              <p>{t.message}</p>
                              {t.question_category && <Badge variant="outline" className="text-[9px] mt-1">{t.question_category}</Badge>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.isArray(ir.key_topics_covered) && ir.key_topics_covered.length > 0 && (
                  <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                    <CardHeader><CardTitle className="text-xs">Topics Covered</CardTitle></CardHeader>
                    <CardContent>{ir.key_topics_covered.map((t: string, i: number) => <Badge key={i} variant="secondary" className="text-[10px] mr-1 mb-1">{t}</Badge>)}</CardContent>
                  </Card>
                )}
                {Array.isArray(ir.candidate_highlights) && ir.candidate_highlights.length > 0 && (
                  <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                    <CardHeader><CardTitle className="text-xs">Highlights</CardTitle></CardHeader>
                    <CardContent>{ir.candidate_highlights.map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 py-0.5"><FiCheckCircle className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-xs">{h}</span></div>
                    ))}</CardContent>
                  </Card>
                )}
                {Array.isArray(ir.areas_of_concern) && ir.areas_of_concern.length > 0 && (
                  <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                    <CardHeader><CardTitle className="text-xs">Concerns</CardTitle></CardHeader>
                    <CardContent>{ir.areas_of_concern.map((c: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 py-0.5"><FiAlertCircle className="h-3 w-3 text-amber-600 flex-shrink-0 mt-0.5" /><span className="text-xs">{c}</span></div>
                    ))}</CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Evaluation Tab */}
        <TabsContent value="evaluation" className="mt-4 space-y-4">
          {!er && !evalLoading && (
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FiStar className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No evaluation yet</p>
                <Button onClick={handleEvaluate} disabled={!ir}>
                  <FiStar className="mr-2 h-4 w-4" /> Evaluate Candidate
                </Button>
                {!ir && <p className="text-xs text-muted-foreground mt-2">Complete the interview first</p>}
              </CardContent>
            </Card>
          )}
          {evalLoading && (
            <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
              <CardContent className="py-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <p className="text-sm font-medium">Generating evaluation report...</p>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              </CardContent>
            </Card>
          )}
          {er && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Category Scores</CardTitle>
                      <Badge className={`text-xs ${recBadge(er.recommendation)}`}>{er.recommendation}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <ScoreGauge score={er.overall_score || 0} size={90} />
                      <div>
                        <p className="text-lg font-bold">Overall Score</p>
                        <p className="text-xs text-muted-foreground">{er.recommendation}</p>
                      </div>
                    </div>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
                  <CardHeader><CardTitle className="text-sm">Evaluation Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{er.detailed_evaluation}</p>
                    <Separator />
                    {Array.isArray(er.strengths) && er.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Strengths</p>
                        {er.strengths.map((s: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 py-0.5"><FiCheckCircle className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-xs">{s}</span></div>
                        ))}
                      </div>
                    )}
                    {Array.isArray(er.areas_for_development) && er.areas_for_development.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Areas for Development</p>
                        {er.areas_for_development.map((a: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 py-0.5"><FiAlertCircle className="h-3 w-3 text-amber-600 flex-shrink-0 mt-0.5" /><span className="text-xs">{a}</span></div>
                        ))}
                      </div>
                    )}
                    {Array.isArray(er.red_flags) && er.red_flags.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Red Flags</p>
                        {er.red_flags.map((r: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 py-0.5"><FiXCircle className="h-3 w-3 text-red-600 flex-shrink-0 mt-0.5" /><span className="text-xs">{r}</span></div>
                        ))}
                      </div>
                    )}
                    <Separator />
                    <p className="text-xs text-muted-foreground"><strong>Justification:</strong> {er.hiring_justification}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
