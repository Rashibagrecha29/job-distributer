import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import axios from 'axios'
import { AdminLayout } from './adminLayout'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [message, setMessage] = useState('')

  const handleAuth = async (type) => {
    try {
      const endpoint = type === 'register' ? '/auth/register' : '/auth/login'
      const payload = type === 'register'
        ? { email: form.email, username: form.username, password: form.password }
        : new URLSearchParams({ username: form.username, password: form.password })

      const response = await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: type === 'register' ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      if (type === 'login') {
        localStorage.setItem('token', response.data.access_token)
        setToken(response.data.access_token)
        setMessage('Logged in successfully')
      } else {
        setMessage('Registered successfully. Please log in.')
      }
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Authentication failed')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken('')
    setMessage('Logged out successfully')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Routes>
        <Route path="/auth" element={token ? <Navigate to="/" /> : <AuthScreen form={form} setForm={setForm} handleAuth={handleAuth} message={message} />} />
        <Route path="/*" element={token ? <AuthenticatedApp token={token} onLogout={handleLogout} /> : <Navigate to="/auth" />} />
      </Routes>
    </div>
  )
}

function AuthenticatedApp({ token, onLogout }) {
  return (
    <AdminLayout token={token} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Home token={token} />} />
        <Route path="/projects" element={<ProjectsPage token={token} />} />
        <Route path="/queues" element={<QueuesPage token={token} />} />
        <Route path="/jobs" element={<JobsPage token={token} />} />
        <Route path="/workers" element={<WorkersPage token={token} />} />
        <Route path="/analytics" element={<AnalyticsPage token={token} />} />
        <Route path="/dead-letter" element={<DeadLetterPage token={token} />} />
        <Route path="/logs" element={<LogsPage token={token} />} />
      </Routes>
    </AdminLayout>
  )
}

function Home({ token }) {
  const [projects, setProjects] = useState([])
  const [queues, setQueues] = useState([])
  const [jobs, setJobs] = useState([])
  const [workers, setWorkers] = useState([])
  const [metrics, setMetrics] = useState({ project_count: 0, queue_count: 0, job_count: 0, completed_jobs: 0, failed_jobs: 0 })
  const [deadLetters, setDeadLetters] = useState([])
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [projectMessage, setProjectMessage] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [queueForm, setQueueForm] = useState({ name: '', priority: 5, concurrency_limit: 1, paused: false })
  const [jobForm, setJobForm] = useState({ name: '', job_type: 'immediate', payload: '', priority: 5, max_retries: 3, delay_seconds: 0 })
  const [editingProjectId, setEditingProjectId] = useState(null)

  const loadProjects = async () => {
    if (!token) return
    try {
      const response = await axios.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProjects(response.data)
      return response.data
    } catch (error) {
      setProjectMessage(error.response?.data?.detail || 'Unable to load projects')
      return []
    }
  }

  const loadProjectDetails = async (projectId) => {
    if (!token || !projectId) return
    try {
      const queueResponse = await axios.get(`${API_URL}/projects/${projectId}/queues`, { headers: { Authorization: `Bearer ${token}` } })
      setQueues(queueResponse.data)
      if (queueResponse.data[0]) {
        const jobResponse = await axios.get(`${API_URL}/projects/${projectId}/queues/${queueResponse.data[0].id}/jobs`, { headers: { Authorization: `Bearer ${token}` } })
        setJobs(jobResponse.data)
      }
    } catch (error) {
      setProjectMessage(error.response?.data?.detail || 'Unable to load project details')
    }
  }

  const loadWorkers = async () => {
    if (!token) return
    try {
      const response = await axios.get(`${API_URL}/workers`, { headers: { Authorization: `Bearer ${token}` } })
      setWorkers(response.data)
    } catch (error) {
      setProjectMessage(error.response?.data?.detail || 'Unable to load workers')
    }
  }

  const loadMetrics = async () => {
    if (!token) return
    try {
      const response = await axios.get(`${API_URL}/metrics`, { headers: { Authorization: `Bearer ${token}` } })
      setMetrics(response.data)
    } catch (error) {
      setProjectMessage(error.response?.data?.detail || 'Unable to load metrics')
    }
  }

  const loadDeadLetters = async () => {
    if (!token) return
    try {
      const response = await axios.get(`${API_URL}/dead-letter`, { headers: { Authorization: `Bearer ${token}` } })
      setDeadLetters(response.data)
    } catch (error) {
      setProjectMessage(error.response?.data?.detail || 'Unable to load dead letters')
    }
  }

  const refreshDashboard = async (projectId = selectedProjectId) => {
    if (!token) return
    await loadProjects()
    await loadWorkers()
    await loadMetrics()
    await loadDeadLetters()
    if (projectId) {
      await loadProjectDetails(projectId)
    }
  }

  useEffect(() => {
    if (token) {
      loadProjects()
      loadWorkers()
      loadMetrics()
      loadDeadLetters()
    }
  }, [token])

  const handleProjectSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingProjectId) {
        await axios.put(`${API_URL}/projects/${editingProjectId}`, projectForm, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setProjectMessage('Project updated')
      } else {
        await axios.post(`${API_URL}/projects`, projectForm, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setProjectMessage('Project created')
      }
      setProjectForm({ name: '', description: '' })
      setEditingProjectId(null)
      const refreshed = await axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } })
      const createdProject = refreshed.data.find((project) => project.name === projectForm.name)
      if (createdProject) {
        setSelectedProjectId(createdProject.id)
      }
      setProjects(refreshed.data)
      await refreshDashboard(createdProject?.id || selectedProjectId)
    } catch (error) {
      setProjectMessage(error.response?.data?.detail || 'Project action failed')
    }
  }

  const handleCreateQueue = async (event) => {
    event.preventDefault()
    if (!selectedProjectId) return
    try {
      await axios.post(`${API_URL}/projects/${selectedProjectId}/queues`, {
        name: queueForm.name,
        priority: queueForm.priority,
        concurrency_limit: queueForm.concurrency_limit,
        paused: queueForm.paused,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setQueueForm({ name: '', priority: 5, concurrency_limit: 1, paused: false })
      await refreshDashboard(selectedProjectId)
    } catch (error) {
      setProjectMessage(error.response?.data?.detail || 'Queue creation failed')
    }
  }

  const handleCreateJob = async (event) => {
    event.preventDefault()
    if (!selectedProjectId || !queues[0]) return
    try {
      await axios.post(`${API_URL}/projects/${selectedProjectId}/queues/${queues[0].id}/jobs`, jobForm, { headers: { Authorization: `Bearer ${token}` } })
      setJobForm({ name: '', job_type: 'immediate', payload: '', priority: 5, max_retries: 3, delay_seconds: 0 })
      await refreshDashboard(selectedProjectId)
    } catch (error) {
      setProjectMessage(error.response?.data?.detail || 'Job creation failed')
    }
  }

  const handleDelete = async (projectId) => {
    try {
      await axios.delete(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProjectMessage('Project deleted')
      await refreshDashboard()
    } catch (error) {
      setProjectMessage(error.response?.data?.detail || 'Delete failed')
    }
  }

  const startEdit = (project) => {
    setEditingProjectId(project.id)
    setProjectForm({ name: project.name, description: project.description || '' })
  }

  if (!token) {
    return (
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-3xl font-semibold">Welcome to Job Distributor</h1>
          <p className="mt-3 text-slate-400">A production-inspired internship project for managing queues, workers, and jobs.</p>
          <Link to="/auth" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">Get Started</Link>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-xl font-semibold">Feature Highlights</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>• JWT authentication</li>
            <li>• Project and queue management</li>
            <li>• Worker polling and execution</li>
            <li>• Analytics and dashboards</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="text-sm text-slate-400">Projects</div><div className="mt-2 text-2xl font-semibold">{metrics.project_count}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="text-sm text-slate-400">Queues</div><div className="mt-2 text-2xl font-semibold">{metrics.queue_count}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="text-sm text-slate-400">Jobs</div><div className="mt-2 text-2xl font-semibold">{metrics.job_count}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="text-sm text-slate-400">Workers</div><div className="mt-2 text-2xl font-semibold">{workers.length}</div></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Projects</h2>
              <p className="text-sm text-slate-400">Create, edit, and remove your owned projects.</p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-400">Authenticated</span>
          </div>
          {projectMessage ? <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300">{projectMessage}</div> : null}
          <form onSubmit={handleProjectSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <input className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" placeholder="Project name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
            <textarea className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" placeholder="Description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows="3" />
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium" type="submit">{editingProjectId ? 'Update project' : 'Create project'}</button>
          </form>
          <div className="mt-6 space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <button className="text-left" onClick={() => { setSelectedProjectId(project.id); loadProjectDetails(project.id) }}>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{project.description || 'No description provided.'}</p>
                  </button>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-slate-700 px-3 py-1 text-sm" onClick={() => startEdit(project)}>Edit</button>
                    <button className="rounded-lg border border-rose-700 px-3 py-1 text-sm text-rose-300" onClick={() => handleDelete(project.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold">Queues & Jobs</h3>
            <form onSubmit={handleCreateQueue} className="mt-4 space-y-2">
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Queue name" value={queueForm.name} onChange={(e) => setQueueForm({ ...queueForm, name: e.target.value })} required />
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Priority" type="number" value={queueForm.priority} onChange={(e) => setQueueForm({ ...queueForm, priority: Number(e.target.value) })} />
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Concurrency" type="number" value={queueForm.concurrency_limit} onChange={(e) => setQueueForm({ ...queueForm, concurrency_limit: Number(e.target.value) })} />
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium" type="submit">Create queue</button>
              {!selectedProjectId ? <div className="text-xs text-amber-400">Select a project first to create a queue.</div> : null}
            </form>
            <div className="mt-4 space-y-2">
              {queues.map((queue) => <div key={queue.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">{queue.name} · priority {queue.priority}</div>)}
            </div>
            <form onSubmit={handleCreateJob} className="mt-4 space-y-2">
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Job name" value={jobForm.name} onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })} required />
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Payload" value={jobForm.payload} onChange={(e) => setJobForm({ ...jobForm, payload: e.target.value })} />
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium" type="submit">Create job</button>
            </form>
            <div className="mt-4 space-y-2">
              {jobs.map((job) => <div key={job.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">{job.name} · {job.status}</div>)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold">Workers & DLQ</h3>
            <div className="mt-4 space-y-2">
              {workers.map((worker) => <div key={worker.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">{worker.name} · {worker.status}</div>)}
            </div>
            <div className="mt-4 space-y-2">
              {deadLetters.map((entry) => <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">DLQ #{entry.id} · {entry.reason || 'No reason'}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectsPage({ token }) {
  const [projects, setProjects] = useState([])
  useEffect(() => {
    const load = async () => {
      const response = await axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } })
      setProjects(response.data)
    }
    load()
  }, [token])
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-semibold">Projects</h2>
      <p className="mt-2 text-sm text-slate-400">Create and manage projects that group related queues and jobs.</p>
      <div className="mt-6 grid gap-3">
        {projects.map((project) => <div key={project.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="font-medium">{project.name}</div><div className="mt-1 text-sm text-slate-400">{project.description || 'No description provided.'}</div></div>)}
      </div>
    </div>
  )
}

function QueuesPage({ token }) {
  const [queues, setQueues] = useState([])
  useEffect(() => {
    const load = async () => {
      const response = await axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } })
      const projects = response.data
      const queueList = []
      for (const project of projects) {
        const res = await axios.get(`${API_URL}/projects/${project.id}/queues`, { headers: { Authorization: `Bearer ${token}` } })
        queueList.push(...res.data.map((queue) => ({ ...queue, projectName: project.name })))
      }
      setQueues(queueList)
    }
    load()
  }, [token])
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-semibold">Queues</h2>
      <p className="mt-2 text-sm text-slate-400">Each queue supports priority, concurrency, pause/resume, and retries.</p>
      <div className="mt-6 grid gap-3">
        {queues.map((queue) => <div key={queue.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="font-medium">{queue.name}</div><div className="mt-1 text-sm text-slate-400">Project: {queue.projectName} · Priority: {queue.priority} · Concurrency: {queue.concurrency_limit}</div></div>)}
      </div>
    </div>
  )
}

function JobsPage({ token }) {
  const [jobs, setJobs] = useState([])
  useEffect(() => {
    const load = async () => {
      const projectsResponse = await axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } })
      const jobsList = []
      for (const project of projectsResponse.data) {
        const queuesResponse = await axios.get(`${API_URL}/projects/${project.id}/queues`, { headers: { Authorization: `Bearer ${token}` } })
        for (const queue of queuesResponse.data) {
          const jobsResponse = await axios.get(`${API_URL}/projects/${project.id}/queues/${queue.id}/jobs`, { headers: { Authorization: `Bearer ${token}` } })
          jobsList.push(...jobsResponse.data.map((job) => ({ ...job, projectName: project.name, queueName: queue.name })))
        }
      }
      setJobs(jobsList)
    }
    load()
  }, [token])
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-semibold">Jobs</h2>
      <p className="mt-2 text-sm text-slate-400">Create and inspect jobs for immediate, delayed, scheduled, recurring, or batch flows.</p>
      <div className="mt-6 grid gap-3">
        {jobs.map((job) => <div key={job.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="flex items-center justify-between"><div><div className="font-medium">{job.name}</div><div className="mt-1 text-sm text-slate-400">{job.projectName} / {job.queueName}</div></div><span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{job.status}</span></div></div>)}
      </div>
    </div>
  )
}

function WorkersPage({ token }) {
  const [workers, setWorkers] = useState([])
  useEffect(() => {
    const load = async () => {
      const response = await axios.get(`${API_URL}/workers`, { headers: { Authorization: `Bearer ${token}` } })
      setWorkers(response.data)
    }
    load()
  }, [token])
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-semibold">Workers</h2>
      <p className="mt-2 text-sm text-slate-400">Track worker status, heartbeat timestamps, and current work.</p>
      <div className="mt-6 grid gap-3">
        {workers.map((worker) => <div key={worker.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="font-medium">{worker.name}</div><div className="mt-1 text-sm text-slate-400">Status: {worker.status} · Heartbeat: {worker.last_heartbeat_at || 'n/a'}</div></div>)}
      </div>
    </div>
  )
}

function AnalyticsPage({ token }) {
  const [metrics, setMetrics] = useState({ project_count: 0, queue_count: 0, job_count: 0, completed_jobs: 0, failed_jobs: 0 })
  const [workers, setWorkers] = useState([])
  const [deadLetters, setDeadLetters] = useState([])

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [metricsRes, workersRes, deadLettersRes] = await Promise.all([
          axios.get(`${API_URL}/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/workers`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/dead-letter`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        setMetrics(metricsRes.data)
        setWorkers(workersRes.data)
        setDeadLetters(deadLettersRes.data)
      } catch (error) {
        console.error(error)
      }
    }

    if (token) {
      loadAnalytics()
    }
  }, [token])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
        <p className="mt-2 text-sm text-slate-400">A dedicated view for workload health, active workers, and failed jobs.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="text-sm text-slate-400">Completed jobs</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-400">{metrics.completed_jobs}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="text-sm text-slate-400">Failed jobs</div>
          <div className="mt-2 text-3xl font-semibold text-rose-400">{metrics.failed_jobs}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="text-sm text-slate-400">Active workers</div>
          <div className="mt-2 text-3xl font-semibold text-sky-400">{workers.filter((worker) => worker.status === 'busy').length}</div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">System Summary</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between"><span>Projects</span><span>{metrics.project_count}</span></div>
            <div className="flex justify-between"><span>Queues</span><span>{metrics.queue_count}</span></div>
            <div className="flex justify-between"><span>Total jobs</span><span>{metrics.job_count}</span></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Dead-letter queue</h3>
          <div className="mt-4 space-y-2">
            {deadLetters.length === 0 ? <div className="text-sm text-slate-400">No dead-letter entries yet.</div> : deadLetters.map((entry) => <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">DLQ #{entry.id} · {entry.reason || 'No reason'}</div>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function DeadLetterPage({ token }) {
  const [deadLetters, setDeadLetters] = useState([])
  useEffect(() => {
    const load = async () => {
      const response = await axios.get(`${API_URL}/dead-letter`, { headers: { Authorization: `Bearer ${token}` } })
      setDeadLetters(response.data)
    }
    load()
  }, [token])
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-semibold">Dead Letter Queue</h2>
      <p className="mt-2 text-sm text-slate-400">Failed jobs are surfaced here for retry or cleanup.</p>
      <div className="mt-6 grid gap-3">
        {deadLetters.map((entry) => <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="font-medium">Job #{entry.job_id}</div><div className="mt-1 text-sm text-slate-400">Reason: {entry.reason || 'No reason provided.'}</div></div>)}
      </div>
    </div>
  )
}

function LogsPage({ token }) {
  const [logs, setLogs] = useState([])
  useEffect(() => {
    const load = async () => {
      const response = await axios.get(`${API_URL}/logs`, { headers: { Authorization: `Bearer ${token}` } })
      setLogs(response.data)
    }
    load()
  }, [token])
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-semibold">Logs</h2>
      <p className="mt-2 text-sm text-slate-400">Execution log entries show status transitions and worker activity.</p>
      <div className="mt-6 grid gap-3">
        {logs.map((log) => <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="font-medium">{log.event}</div><div className="mt-1 text-sm text-slate-400">{log.message || 'No details'}</div></div>)}
      </div>
    </div>
  )
}

function AuthScreen({ form, setForm, handleAuth, message }) {
  const [mode, setMode] = useState('login')

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
      <div className="mb-6 flex gap-2 rounded-lg bg-slate-800 p-1">
        <button className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === 'login' ? 'bg-blue-600' : 'text-slate-400'}`} onClick={() => setMode('login')}>Login</button>
        <button className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === 'register' ? 'bg-blue-600' : 'text-slate-400'}`} onClick={() => setMode('register')}>Register</button>
      </div>
      {message ? <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300">{message}</div> : null}
      <div className="space-y-4">
        {mode === 'register' ? (
          <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        ) : null}
        <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="w-full rounded-lg bg-blue-600 px-3 py-2 font-medium" onClick={() => handleAuth(mode)}>{mode === 'register' ? 'Create account' : 'Sign in'}</button>
      </div>
    </div>
  )
}

export default App
