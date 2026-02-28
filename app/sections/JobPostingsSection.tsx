'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiPlus, FiSearch, FiArrowRight, FiX } from 'react-icons/fi'

interface Candidate {
  id: string; name: string; email: string; resumeText: string; resumeFileName: string
  screeningResult: any; interviewResult: any; evaluationResult: any; stage: string; shortlisted: boolean
}

interface Job {
  id: string; title: string; department: string; description: string; requirements: string[]
  status: 'active' | 'closed' | 'draft'; createdAt: string; candidates: Candidate[]
}

interface JobPostingsProps {
  jobs: Job[]
  onCreateJob: (job: Omit<Job, 'id' | 'createdAt' | 'candidates'>) => void
  onSelectJob: (jobId: string) => void
}

export default function JobPostingsSection({ jobs, onCreateJob, onSelectJob }: JobPostingsProps) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newJob, setNewJob] = useState({ title: '', department: 'Engineering', description: '', requirements: [] as string[], status: 'active' as const })
  const [reqInput, setReqInput] = useState('')

  const departments = Array.from(new Set(jobs.map(j => j.department)))

  const filtered = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'all' || j.department === deptFilter
    return matchSearch && matchDept
  })

  const handleAddReq = () => {
    if (reqInput.trim() && !newJob.requirements.includes(reqInput.trim())) {
      setNewJob(p => ({ ...p, requirements: [...p.requirements, reqInput.trim()] }))
      setReqInput('')
    }
  }

  const handleRemoveReq = (req: string) => {
    setNewJob(p => ({ ...p, requirements: p.requirements.filter(r => r !== req) }))
  }

  const handleSubmit = () => {
    if (!newJob.title.trim() || !newJob.description.trim()) return
    onCreateJob(newJob)
    setNewJob({ title: '', department: 'Engineering', description: '', requirements: [], status: 'active' })
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Postings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your open positions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><FiPlus className="mr-2 h-4 w-4" /> Create New Job</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Job Posting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label htmlFor="job-title">Job Title</Label>
                <Input id="job-title" placeholder="e.g. Senior Frontend Engineer" value={newJob.title}
                  onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="job-dept">Department</Label>
                <Select value={newJob.department} onValueChange={v => setNewJob(p => ({ ...p, department: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="job-desc">Description</Label>
                <Textarea id="job-desc" placeholder="Job description..." value={newJob.description}
                  onChange={e => setNewJob(p => ({ ...p, description: e.target.value }))} className="mt-1 min-h-[100px]" />
              </div>
              <div>
                <Label>Requirements</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="Add a skill..." value={reqInput} onChange={e => setReqInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddReq() } }} />
                  <Button type="button" variant="secondary" onClick={handleAddReq}>Add</Button>
                </div>
                {newJob.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newJob.requirements.map(req => (
                      <Badge key={req} variant="secondary" className="gap-1 text-xs">
                        {req}
                        <button onClick={() => handleRemoveReq(req)} className="ml-0.5 hover:text-destructive"><FiX className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={!newJob.title.trim() || !newJob.description.trim()}>
                Create Job Posting
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FiSearch className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No job postings found</p>
          <p className="text-xs text-muted-foreground mt-1">Create a new job posting to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(job => (
            <Card key={job.id} className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectJob(job.id)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">{job.department}</Badge>
                  <Badge className={`text-xs capitalize ${job.status === 'draft' ? 'bg-muted text-muted-foreground' : ''}`}>{job.status}</Badge>
                </div>
                <h3 className="font-semibold text-sm mt-2">{job.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.requirements.slice(0, 3).map(r => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
                    {job.requirements.length > 3 && <Badge variant="outline" className="text-[10px]">+{job.requirements.length - 3}</Badge>}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">{Array.isArray(job.candidates) ? job.candidates.length : 0} candidates</span>
                  <FiArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
