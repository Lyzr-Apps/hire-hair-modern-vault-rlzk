'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FiBriefcase, FiUsers, FiMessageSquare, FiCheckCircle, FiPlus, FiArrowRight, FiClock } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  status: 'active' | 'closed' | 'draft'
  createdAt: string
  candidates: Candidate[]
}

interface DashboardProps {
  jobs: Job[]
  onNavigate: (page: string) => void
  onSelectJob: (jobId: string) => void
}

export default function DashboardSection({ jobs, onNavigate, onSelectJob }: DashboardProps) {
  const allCandidates = jobs.flatMap(j => Array.isArray(j.candidates) ? j.candidates : [])
  const openPositions = jobs.filter(j => j.status === 'active').length
  const totalCandidates = allCandidates.length
  const interviewsDone = allCandidates.filter(c => c.interviewResult).length
  const offersMade = allCandidates.filter(c => c.stage === 'hired').length

  const pipelineData = [
    { stage: 'New', count: allCandidates.filter(c => c.stage === 'new').length, fill: 'hsl(var(--chart-1))' },
    { stage: 'Screened', count: allCandidates.filter(c => ['screened', 'screening'].includes(c.stage)).length, fill: 'hsl(var(--chart-2))' },
    { stage: 'Interviewed', count: allCandidates.filter(c => ['interviewed', 'interview'].includes(c.stage)).length, fill: 'hsl(var(--chart-3))' },
    { stage: 'Evaluated', count: allCandidates.filter(c => ['evaluated', 'evaluation'].includes(c.stage)).length, fill: 'hsl(var(--chart-4))' },
    { stage: 'Hired', count: allCandidates.filter(c => c.stage === 'hired').length, fill: 'hsl(var(--chart-5))' },
  ]

  const stats = [
    { label: 'Open Positions', value: openPositions, icon: FiBriefcase, color: 'text-blue-600' },
    { label: 'Total Candidates', value: totalCandidates, icon: FiUsers, color: 'text-purple-600' },
    { label: 'Interviews Done', value: interviewsDone, icon: FiMessageSquare, color: 'text-amber-600' },
    { label: 'Offers Made', value: offersMade, icon: FiCheckCircle, color: 'text-green-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your hiring pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate('candidates')}>
            <FiUsers className="mr-2 h-4 w-4" /> View Candidates
          </Button>
          <Button onClick={() => onNavigate('jobs')}>
            <FiPlus className="mr-2 h-4 w-4" /> New Job Posting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
            <CardContent className="p-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Hiring Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[260px]">
              {allCandidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <FiClock className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No recent activity yet</p>
                  <p className="text-xs mt-1">Start by screening candidates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allCandidates.slice(0, 10).map((c) => (
                    <div key={c.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-accent/50">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{c.stage}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">{c.stage}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {jobs.filter(j => j.status === 'active').length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Active Job Postings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.filter(j => j.status === 'active').map((job) => (
              <Card
                key={job.id}
                className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onSelectJob(job.id)}
              >
                <CardContent className="p-6 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">{job.department}</Badge>
                    <Badge className="text-xs capitalize">{job.status}</Badge>
                  </div>
                  <h3 className="font-semibold text-sm mt-2">{job.title}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">{Array.isArray(job.candidates) ? job.candidates.length : 0} candidates</span>
                    <FiArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
