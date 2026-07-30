# Product Requirements Document (PRD)

# KOMPAK
### Komunitas Aktif dengan Poin dan Kolaborasi

Version: 1.0 (MVP)

---

# 1. Overview

## Background

Many neighborhood communities (RT/RW) still manage activities manually. Event announcements are scattered through messaging applications, attendance is recorded manually, and there is no structured incentive to encourage participation.

At the same time, local businesses (UMKM) and sponsors have limited opportunities to engage directly with the community.

KOMPAK aims to solve these problems by providing a digital platform that manages community events, verifies attendance using geofencing and facial recognition, rewards active participation through a point system, and connects residents with local business partners.

---

# 2. Goals

## Primary Goals

- Increase citizen participation in community activities.
- Digitalize event management and attendance.
- Provide transparent attendance records.
- Encourage active participation through a reward system.
- Promote local businesses through reward partnerships.

## Success Metrics

- Number of registered citizens.
- Number of verified providers.
- Number of published events.
- Attendance rate per event.
- Total points earned.
- Total rewards redeemed.
- Number of active providers.

---

# 3. Scope

## In Scope (MVP)

### User Management

- Citizen registration
- Admin approval
- Login
- Profile management
- Face enrollment

### Provider Management

- Provider registration
- Provider verification
- Provider management
- Provider without account support

### Event Management

- Create event
- Edit event
- Publish event
- Close event

### Attendance

- Geofencing validation
- Face verification
- Attendance recording

### Point System

- Earn points after successful attendance
- View balance
- Leaderboard

### Reward System

- Reward catalog
- Reward redemption
- Provider fulfillment

### Announcement

- Create announcement
- View announcement

---

## Out of Scope

- Online payment
- Chat
- Push notification
- Event discussion forum
- QR Attendance
- Reward delivery tracking
- Multi-language
- Analytics Dashboard
- Super Admin
- Multi RT/RW support

---

# 4. User Roles

## Admin

Responsibilities

- Approve citizens
- Approve providers
- Manage events
- Manage rewards
- Manage announcements
- View attendance

---

## Citizen

Responsibilities

- Register account
- Register provider
- Join events
- Redeem rewards
- View announcements
- View leaderboard

---

# 5. User Flow

## Citizen Registration

```
Citizen

↓

Register Account

↓

Status = PENDING

↓

Admin Approval

↓

Status = ACTIVE

↓

Login
```

---

## Provider Registration

```
Citizen

↓

Register Provider

↓

Status = PENDING

↓

Admin Approval

↓

Status = VERIFIED

↓

Can Create Rewards
```

---

## Event Attendance

```
Citizen

↓

Select Event

↓

GPS Validation

↓

Face Verification

↓

Attendance Recorded

↓

Event Transaction Created

↓

User Balance Updated

↓

Leaderboard Updated
```

---

## Reward Redemption

```
Citizen

↓

Select Reward

↓

Redeem

↓

Point Deducted

↓

Provider Confirms

↓

Completed
```

---

# 6. Functional Requirements

## Authentication

### Citizen

- Register
- Login
- Logout
- Update profile

### Admin

- Login
- Approve user
- Reject user
- Disable user

---

## Provider

### Citizen

- Register provider
- Update provider

### Admin

- Approve provider
- Reject provider
- View providers

---

## Event

### Admin

- Create event
- Update event
- Delete event
- Publish event
- Close event

### Citizen

- View events
- Join attendance

---

## Attendance

System shall

- Validate user location
- Validate facial identity
- Prevent duplicate attendance
- Record attendance
- Generate point transaction

---

## Rewards

Admin

- Create reward
- Update reward
- Disable reward

Citizen

- Browse rewards
- Redeem rewards
- View redemption history

---

## Announcements

Admin

- Create announcement
- Edit announcement

Citizen

- View announcements

---

# 7. Non Functional Requirements

## Security

- JWT Authentication
- Password hashing
- Role-based authorization
- Face embedding stored as service ID
- HTTPS only

---

## Performance

- API response under 500 ms for normal requests
- Attendance verification under 5 seconds
- Pagination for list endpoints

---

## Availability

- 99% uptime during MVP

---

## Scalability

Database designed using UUID.

Storage supports external object storage.

---

# 8. Database Summary

## Main Entities

- Users
- Providers
- Rewards
- Events
- Attendances
- EventTransactions
- RewardRedemptions
- Announcements

---

# 9. Business Rules

## User

- User registration requires admin approval.
- Only ACTIVE users may log in.

---

## Provider

- Provider may or may not have an owner account.
- Provider must be VERIFIED before creating rewards.

---

## Attendance

- One attendance per user per event.
- Attendance requires:
  - Valid GPS location.
  - Successful face verification.

---

## Points

- Points are awarded only after successful attendance.
- One attendance generates one point transaction.

---

## Rewards

- Reward stock cannot become negative.
- Reward redemption deducts user balance.
- Redemption status is tracked until completion.

---

# 10. API Modules

Authentication

- Register
- Login
- Logout

Users

- Profile
- Approval

Providers

- CRUD
- Approval

Rewards

- CRUD
- Redemption

Events

- CRUD
- Attendance

Announcements

- CRUD

Leaderboard

- Ranking

Transactions

- Event Transactions
- Reward Redemptions

---

# 11. MVP Acceptance Criteria

A citizen can:

- Register.
- Be approved by admin.
- Enroll face.
- Join an event.
- Pass GPS verification.
- Pass face verification.
- Receive points.
- View leaderboard.
- Redeem rewards.

An admin can:

- Approve users.
- Approve providers.
- Create events.
- Create rewards.
- Publish announcements.

A provider can:

- Be registered.
- Be verified.
- Provide rewards.

---

# 12. Future Enhancements

- Push notifications
- QR code attendance
- AI event recommendations
- Analytics dashboard
- Community forum
- Multi RT/RW support
- Reward reservation
- Sponsor dashboard
- Digital certificates
- Event feedback
- Attendance analytics
- Volunteer hour tracking