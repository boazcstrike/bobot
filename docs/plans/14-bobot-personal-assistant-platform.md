# Bobot Personal Assistant Platform Plan

## Context
This plan supersedes the prior Instagram-centric direction for core product development in this repository.

## Product Goal
Build Bobot as a personal PC assistant with:
- autonomous task execution loops
- voice reminder output
- personal dashboard
- fast shortcuts to GitHub top trending repositories
- SQLite-backed local persistence

## MVP Scope (Phase 1)
1. Next.js dashboard app (`apps/dashboard`)
2. SQLite data layer for reminders
3. Reminder create/list API
4. Browser voice reminder output using Web Speech API
5. GitHub trending repository feed and quick-launch links

## Stack
- Next.js (App Router) + Node runtime
- Prisma ORM with SQLite (`prisma/dev.db`)

## Success Criteria
- Dashboard runs locally and loads reminders + trending data
- Reminder can be created and persists to SQLite
- Due reminder triggers voice output in browser
- Trending list links open target repositories

## Immediate Next Milestones
1. Add recurring reminders and dismissal/snooze states
2. Add background scheduler service for autonomous reminder checks
3. Add system integrations (notifications, calendar, local tasks)
