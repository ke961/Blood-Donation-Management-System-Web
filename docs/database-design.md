# Database Design

## Tables

### users
id | email | password | name | phone | role | status | created_at

### donors
id | user_id | blood_type | weight | height | eligibility | last_donation | count

### hospitals
id | user_id | name | reg_no | address | phone | status

### appointments
id | donor_id | hospital_id | date | status | type

### blood_units
id | donation_id | blood_type | quantity | collection_date | expiry | status

### blood_requests
id | hospital_id | blood_type | quantity | urgency | status | date

### notifications
id | user_id | type | message | sent_date | status

### donation_history
id | donor_id | date | blood_type | quantity | center


## Relationships
- User → Donor: 1:1
- User → Hospital: 1:1
- Donor → Appointment: 1:M
- Hospital → Appointment: 1:M
- Hospital → Request: 1:M
- Appointment → BloodUnit: 1:1

## Indexes
- users(email)
- blood_units(blood_type, status)
- appointments(date, status)
- requests(status, urgency)

## Backup
- Daily automated backups
- 30-day retention
