'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiSearch, FiPlus, FiFileText, FiUsers, FiX } from 'react-icons/fi'

interface Job {
  id: string
  title: string
  department: string
  description: string
  requirements: string[]
  status: 'active' | 'closed' | 'draft'
  createdAt: string
  candidates: any[]
}

interface JobPostingsProps {
  jobs: Job[]
  onCreateJob: (job: Omit<Job, 'id' | 'createdAt' | 'candidates'>) => void
  onSelectJob: (jobId: string) => void
}

export default function JobPostingsSection({ jobs, onCreateJob, onSelectJob }: JobPostingsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newJob, setNewJob] = useState({ title: '', department: 'Engineering', description: '', requirements: [] as string[], status: 'active' as const })
  const [requirementInput, setRequirementInput] = useState('')

  const departments = useMemo(() => {
    const depts = new Set(jobs.map(j => j.department))
    return Array.from(depts)
  }, [jobs])

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.department.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDept = deptFilter === 'all' || j.department === deptFilter
      return matchesSearch && matchesDept
    })
  }, [jobs, searchQuery, deptFilter])

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setNewJob(prev => ({ ...prev, requirements: [...prev.requirements, requirementInput.trim()] }))
      setRequirementInput('')
    }
  }

  const handleRemoveRequirement = (idx: number) => {
    setNewJob(prev => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== idx) }))
  }

  const handleCreate = () => {
    if (!newJob.title.trim() || !newJob.description.trim()) return
    onCreateJob(newJob)
    setNewJob({ title: '', department: 'Engineering', description: '', requirements: [], status: 'active' })
    setShowCreateDialog(false)
  }

  const statusColor = (status: string) => {
    if (status === 'active') return 'bg-green-100 text-green-700'
    if (status === 'closed') return 'bg-red-100 text-red-700'
    return 'bg-secondary text-secondary-foreground'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Postings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage open positions and track candidates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <FiPlus className="mr-2 h-4 w-4" /> Create New Job
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredJobs.length === 0 ? (
        <Card className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FiFileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No job postings found</p>
            <p className="text-sm text-muted-foreground mt-1">Create a new job to get started</p>
            <Button className="mt-4" variant="outline" onClick={() => setShowCreateDialog(true)}>
              <FiPlus className="mr-2 h-4 w-4" /> Create Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map(job => (
            <Card key={job.id} className="backdrop-blur-[16px] bg-card/75 border border-white/[0.18] shadow-md hover:shadow-lg transition-all cursor-pointer group" onClick={() => onSelectJob(job.id)}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">{job.department}</Badge>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(job.status)}`}>{job.status}</span>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <FiUsers className="h-3.5 w-3.5" />
                    <span className="text-xs">{Array.isArray(job.candidates) ? job.candidates.length : 0} candidates</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(job.requirements) && job.requirements.slice(0, 2).map((r, i) => (
                      <span key={i} className="text-xs bg-accent px-1.5 py-0.5 rounded">{r}</span>
                    ))}
                    {Array.isArray(job.requirements) && job.requirements.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{job.requirements.length - 2}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create New Job Posting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="job-title">Job Title</Label>
              <Input id="job-title" placeholder="e.g., Senior Software Engineer" value={newJob.title} onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <Label>Department</Label>
              <Select value={newJob.department} onValueChange={(val) => setNewJob(prev => ({ ...prev, department: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="job-desc">Description</Label>
              <Textarea id="job-desc" placeholder="Describe the role, responsibilities..." value={newJob.description} onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))} rows={4} />
            </div>
            <div>
              <Label>Requirements</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Add a skill or requirement" value={requirementInput} onChange={(e) => setRequirementInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRequirement() } }} />
                <Button type="button" variant="outline" size="sm" onClick={handleAddRequirement}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {newJob.requirements.map((req, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                    {req}
                    <button onClick={() => handleRemoveRequirement(idx)} className="ml-1 rounded-full hover:bg-foreground/10 p-0.5">
                      <FiX className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newJob.title.trim() || !newJob.description.trim()}>Create Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
