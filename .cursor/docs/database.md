# Database Design
## Use Supabase
## Tables

### events
- id
- title
- description
- type (normal, encounter, ending)
- is_active

### choices
- id
- event_id
- content
- next_event_id (nullable)
- weight

### choice_effects
- id
- choice_id
- stat (tu_vi, karma, luck)
- value (int)

### choice_conditions
- id
- choice_id
- stat
- operator (>, <, =)
- value

### event_tags
- id
- event_id
- tag

### player_runs
- id
- current_event_id
- stats (JSONB)
- seed

### run_history
- id
- run_id
- event_id
- choice_id

## Notes
- stats lưu dạng JSONB
- không hardcode flow → dùng tag + condition