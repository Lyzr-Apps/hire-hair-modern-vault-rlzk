'use client'

import React, { useState, useCallback } from 'react'
import { Separator } from '@/components/ui/separator'
import { FiBriefcase, FiFileText, FiUsers, FiBarChart2, FiChevronRight, FiChevronLeft } from 'react-icons/fi'

import DashboardSection from './sections/DashboardSection'
import JobPostingsSection from './sections/JobPostingsSection'
import CandidatesSection from './sections/CandidatesSection'
import CandidateDetailSection from './sections/CandidateDetailSection'
import EvaluationsSection from './sections/EvaluationsSection'

// --- Types ---
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

// --- Sample Data ---
const SAMPLE_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    description: 'We are looking for an experienced frontend engineer to build and maintain our web applications using React, TypeScript, and Next.js.',
    requirements: ['React', 'TypeScript', 'Next.js', 'CSS', 'REST APIs'],
    status: 'active',
    createdAt: '2025-12-01',
    candidates: [
      { id: 'c-1', name: 'Alex Johnson', email: 'alex.j@email.com', resumeText: 'Experienced frontend developer with 6 years in React, TypeScript, Next.js. Built e-commerce platforms serving millions of users. BS in Computer Science from MIT. Expert in performance optimization, accessibility, and responsive design. Led a team of 4 developers.', resumeFileName: 'alex_johnson_resume.pdf', screeningResult: null, interviewResult: null, evaluationResult: null, stage: 'new', shortlisted: false },
      { id: 'c-2', name: 'Maria Garcia', email: 'maria.g@email.com', resumeText: 'Full-stack developer with 4 years experience. Proficient in React, Vue.js, Node.js, and Python. Worked at two startups building SaaS products. MS in Software Engineering. Strong background in UI/UX design and user research.', resumeFileName: 'maria_garcia_resume.pdf', screeningResult: null, interviewResult: null, evaluationResult: null, stage: 'new', shortlisted: false },
      { id: 'c-3', name: 'James Chen', email: 'james.c@email.com', resumeText: 'Junior developer with 1.5 years experience in JavaScript and React. Built personal projects including a weather app and a task manager. BS in Information Technology. Quick learner with strong fundamentals in algorithms and data structures.', resumeFileName: 'james_chen_resume.pdf', screeningResult: null, interviewResult: null, evaluationResult: null, stage: 'new', shortlisted: false },
    ],
  },
  {
    id: 'job-2',
    title: 'Product Manager',
    department: 'Product',
    description: 'Seeking a product manager to drive product strategy, roadmap planning, and cross-functional collaboration for our B2B platform.',
    requirements: ['Product Strategy', 'Roadmap Planning', 'Agile', 'Stakeholder Management', 'Data Analysis'],
    status: 'active',
    createdAt: '2025-12-05',
    candidates: [
      { id: 'c-4', name: 'Sarah Williams', email: 'sarah.w@email.com', resumeText: 'Product manager with 5 years in B2B SaaS. Led product launches that grew revenue by 40%. MBA from Stanford. Expert in Agile methodologies, customer discovery, and data-driven decision making.', resumeFileName: 'sarah_williams_resume.pdf', screeningResult: null, interviewResult: null, evaluationResult: null, stage: 'new', shortlisted: false },
    ],
  },
  {
    id: 'job-3',
    title: 'UX Designer',
    department: 'Design',
    description: 'Looking for a UX designer to create intuitive and visually appealing user interfaces for our mobile and web applications.',
    requirements: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility'],
    status: 'draft',
    createdAt: '2025-12-10',
    candidates: [],
  },
]

// --- Agent Info ---
const AGENTS = [
  { id: '69a295bfbb857be96e3e20e3', name: 'Resume Screener', purpose: 'Analyzes resumes against job requirements' },
  { id: '69a295bf42fb78f6798a6c1d', name: 'Interview Conductor', purpose: 'Runs structured AI interviews' },
  { id: '69a295d20082f39a3a37ce52', name: 'Candidate Evaluator', purpose: 'Generates evaluation reports with scoring' },
]

// --- Nav items ---
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: FiBriefcase },
  { key: 'jobs', label: 'Job Postings', icon: FiFileText },
  { key: 'candidates', label: 'Candidates', icon: FiUsers },
  { key: 'evaluations', label: 'Evaluations', icon: FiBarChart2 },
]

// --- Main Page ---
export default function Page() {
  const [jobs, setJobs] = useState<Job[]>(SAMPLE_JOBS)
  const [page, setPage] = useState('dashboard')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null

  const handleNavigate = useCallback((newPage: string) => {
    setPage(newPage)
    if (newPage !== 'candidateDetail') setSelectedCandidate(null)
    if (newPage !== 'candidates' && newPage !== 'candidateDetail') setSelectedJobId(null)
  }, [])

  const handleCreateJob = useCallback((jobData: Omit<Job, 'id' | 'createdAt' | 'candidates'>) => {
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      candidates: [],
    }
    setJobs(prev => [...prev, newJob])
  }, [])

  const handleSelectJob = useCallback((jobId: string) => {
    setSelectedJobId(jobId)
    setPage('candidates')
  }, [])

  const handleUpdateCandidate = useCallback((jobId: string, candidateId: string, updates: Partial<Candidate>) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== jobId) return j
      return {
        ...j,
        candidates: (Array.isArray(j.candidates) ? j.candidates : []).map(c =>
          c.id === candidateId ? { ...c, ...updates } : c
        ),
      }
    }))
    setSelectedCandidate(prev => {
      if (prev?.id === candidateId) return { ...prev, ...updates }
      return prev
    })
  }, [])

  const handleAddCandidate = useCallback((jobId: string, candidate: Omit<Candidate, 'id'>) => {
    const newCandidate: Candidate = { ...candidate, id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
    setJobs(prev => prev.map(j => {
      if (j.id !== jobId) return j
      return { ...j, candidates: [...(Array.isArray(j.candidates) ? j.candidates : []), newCandidate] }
    }))
  }, [])

  const handleSelectCandidate = useCallback((candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setPage('candidateDetail')
  }, [])

  const handleSelectCandidateFromEval = useCallback((candidate: Candidate, jobId: string) => {
    setSelectedJobId(jobId)
    setSelectedCandidate(candidate)
    setPage('candidateDetail')
  }, [])

  const breadcrumb = () => {
    const parts: { label: string; onClick?: () => void }[] = [{ label: 'HireFlow', onClick: () => handleNavigate('dashboard') }]
    if (page === 'dashboard') parts.push({ label: 'Dashboard' })
    if (page === 'jobs') parts.push({ label: 'Job Postings' })
    if (page === 'candidates' && selectedJob) {
      parts.push({ label: 'Job Postings', onClick: () => handleNavigate('jobs') })
      parts.push({ label: selectedJob.title })
    }
    if (page === 'candidates' && !selectedJob) parts.push({ label: 'Candidates' })
    if (page === 'candidateDetail' && selectedJob && selectedCandidate) {
      parts.push({ label: 'Job Postings', onClick: () => handleNavigate('jobs') })
      parts.push({ label: selectedJob.title, onClick: () => { setSelectedCandidate(null); setPage('candidates') } })
      parts.push({ label: selectedCandidate.name })
    }
    if (page === 'evaluations') parts.push({ label: 'Evaluations' })
    return parts
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className={`flex-shrink-0 border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <FiBriefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          {sidebarOpen && <span className="font-bold text-lg tracking-tight">HireFlow</span>}
        </div>
        <Separator />
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = page === item.key || (item.key === 'candidates' && (page === 'candidates' || page === 'candidateDetail'))
            return (
              <button key={item.key} onClick={() => handleNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
        <Separator />
        {sidebarOpen && (
          <div className="p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">AI Agents</p>
            {AGENTS.map(agent => (
              <div key={agent.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{agent.name}</p>
                  <p className="text-muted-foreground truncate text-[10px]">{agent.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors">
            {sidebarOpen ? <FiChevronLeft className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-card/30 backdrop-blur-sm">
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumb().map((part, i, arr) => (
              <React.Fragment key={i}>
                {i > 0 && <FiChevronRight className="h-3 w-3 text-muted-foreground mx-1" />}
                {part.onClick && i < arr.length - 1 ? (
                  <button onClick={part.onClick} className="text-muted-foreground hover:text-foreground transition-colors">{part.label}</button>
                ) : (
                  <span className={i === arr.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>{part.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {page === 'dashboard' && (
            <DashboardSection jobs={jobs} onNavigate={handleNavigate} onSelectJob={handleSelectJob} />
          )}
          {page === 'jobs' && (
            <JobPostingsSection jobs={jobs} onCreateJob={handleCreateJob} onSelectJob={handleSelectJob} />
          )}
          {page === 'candidates' && selectedJob && (
            <CandidatesSection
              job={selectedJob}
              onBack={() => handleNavigate('jobs')}
              onUpdateCandidate={handleUpdateCandidate}
              onAddCandidate={handleAddCandidate}
              onSelectCandidate={handleSelectCandidate}
              activeAgentId={activeAgentId}
              setActiveAgentId={setActiveAgentId}
            />
          )}
          {page === 'candidates' && !selectedJob && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Candidates</h1>
              <p className="text-sm text-muted-foreground">Select a job posting to view its candidates</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.filter(j => j.status === 'active').map(job => (
                  <button key={job.id} onClick={() => handleSelectJob(job.id)}
                    className="text-left p-4 rounded-xl border border-border bg-card/75 backdrop-blur-[16px] hover:shadow-md transition-all">
                    <p className="text-xs text-muted-foreground mb-1">{job.department}</p>
                    <h3 className="font-semibold text-sm">{job.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{Array.isArray(job.candidates) ? job.candidates.length : 0} candidates</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {page === 'candidateDetail' && selectedCandidate && selectedJob && (
            <CandidateDetailSection
              candidate={selectedCandidate}
              job={selectedJob}
              onBack={() => { setSelectedCandidate(null); setPage('candidates') }}
              onUpdateCandidate={handleUpdateCandidate}
              activeAgentId={activeAgentId}
              setActiveAgentId={setActiveAgentId}
            />
          )}
          {page === 'evaluations' && (
            <EvaluationsSection
              jobs={jobs}
              onUpdateCandidate={handleUpdateCandidate}
              onSelectCandidate={handleSelectCandidateFromEval}
            />
          )}
        </div>
      </main>
    </div>
  )
}
