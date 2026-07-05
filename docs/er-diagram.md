# ER Diagram

```text
User 1---* Project
User 1---* Worker
Project 1---* Queue
Queue 1---* Job
Worker 1---* JobExecution
Job 1---* JobExecution
Job 1---* JobLog
Job 1---0..1 DeadLetterQueue
Queue *---1 RetryPolicy
Worker 1---* WorkerHeartbeat
```

## Core Relationships
- A user owns many projects and workers.
- Each project contains many queues.
- Each queue contains many jobs.
- Each worker can process jobs and emit heartbeats.
- Each job can produce logs and optionally end up in the dead-letter queue.
