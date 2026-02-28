'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FiBriefcase, FiUsers, FiMessageSquare, FiCheckCircle, FiPlus, FiArrowRight, FiClock } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

interface DashboardProps {
  jobs: Job[]
  onNavigate: (page: string) => void
}

export default function DashboardSection({ jobs, onNavigate }: DashboardProps) {
  const allCandidates = jobs.flatMap(j => Array.isArray(j.candidates) ? j.candidates : [])
  const openPositions = jobs.filter(j => j.status === 'active').length
  const totalCandidates = allCandidates.length
  const interviewsCompleted = allCandidates.filter(c => c.stage === 'interviewed' || c.stage === 'evaluation' || c.stage === 'evaluated' || c.stage === 'hired').length
  const offersMade = allCandidates.filter(c => c.stage === 'hired').length

  const pipelineData = [
    { stage: 'New', count: allCandidates.filter(c => c.stage === 'new').length },
    { stage: 'Screening', count: allCandidates.filter(c => c.stage === 'screening' || c.stage === 'screened').length },
    { stage: 'Interview', count: allCandidates.filter(c => c.stage === 'interview' || c.stage === 'interviewed').length },
    { stage: 'Evaluated', count: allCandidates.filter(c => c.stage === 'evaluation' || c.stage === 'evaluated').length },
    { stage: 'Hired', count: allCandidates.filter(c => c.stage === 'hired').length },
  ]

  const recentActivities: { text: string; time: string; type: string }[] = []
  allCandidates.forEach(c => {
    if (c.stage === 'screened' && c.screeningResult) {
      recentActivities.push({ text: `${c.name} resume screened`, time: 'Recently', type: 'screening' })
    }
    if ((c.stage === 'interviewed' || c.stage === 'evaluation' || c.stage === 'evaluated') && c.interviewResult) {
      recentActivities.push({ text: `${c.name} interview completed`, time: 'Recently', type: 'interview' })
    }
    if (c.stage === 'evaluated' && c.evaluationResult) {
      recentActivities.push({ text: `${c.name} evaluation finished`, time: 'Recently', type: 'evaluation' })
    }
    if (c.stage === 'hired') {
      recentActivities.push({ text: `${c.name} marked as hired`, time: 'Recently', type: 'hired' })
    }
  })

  const statCards = [
    { label: 'Open Positions', value: openPositions, icon: FiBriefcase, color: 'text-blue-600' },
    { label: 'Total Candidates', value: totalCandidates, icon: FiUsers, color: 'text-purple-600' },
    { label: 'Interviews Done', value: interviewsCompleted, icon: FiMessageSquare, color: 'text-amber-600' },
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
        {statCards.map((stat) => (
          <Card key={stat.label} className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
            <CardContent className="pt-6">
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
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
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
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <FiClock className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No recent activity yet</p>
                  <p className="text-xs mt-1">Start by screening candidates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.slice(0, 10).map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="mt-0.5">
                        {activity.type === 'screening' && <FiCheckCircle className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'interview' && <FiMessageSquare className="h-4 w-4 text-purple-500" />}
                        {activity.type === 'evaluation' && <FiCheckCircle className="h-4 w-4 text-amber-500" />}
                        {activity.type === 'hired' && <FiCheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{activity.text}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.filter(j => j.status === 'active').slice(0, 3).map(job => (
          <Card key={job.id} className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('candidates')}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="text-xs">{job.department}</Badge>
                <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">{job.status}</Badge>
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
  )
}
