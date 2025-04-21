## Usage Goal

The scheduler ensures that

1. you can always submit a job
2. you can always end a job
3. only `n` jobs can run simultaneously

## Design

Imagine this, at a small workplace, there is a WorkerManager and some casual workers who have
flexible schedules. The WorkerManager should coordinate what job to be done, who does the job, and
when to start working, like a very micro-managed workplace. It's natural to think that all
the control of the jobs coordination should be held in WorkerManager, i.e. any functions related
to the job scheduling and evaluation. A worker, on the other side, simply does the job and reports
to the manager.

Therefore, we have the following:

- A job is Finetuning job, which is CPU/GPU-bound task. Multi-threading is not helpful much,
  as there is no I/O. To achieve the aforementioned goal, however, we need a thread pool manager
  to keep track of running jobs and monitor job logs. The finetuning job eventually will be executed
  under a subprocess.

- `worker.py` contains the implementation of the thread pool manager that can spawn a thread and
  finish a thread. It's singleton as a centralized manage station for the worker control.

- The worker threads and subprocesses are daemon, i.e. when the manager or server is closed, they will be
  killed forcefully, regardless of their states. This is so far OK, as a training process is
  not critical to the server.

## Why BYO ThreadPool

1. DIY and Learn :)
