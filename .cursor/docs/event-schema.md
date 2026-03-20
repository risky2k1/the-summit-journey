# Event Schema (AI Compatible)

## JSON Format

{
  "event": {
    "title": "string",
    "description": "string"
  },
  "tags": ["string"],
  "choices": [
    {
      "content": "string",
      "effects": [
        { "stat": "tu_vi", "value": 5 }
      ],
      "conditions": [
        { "stat": "karma", "operator": "<", "value": 0 }
      ],
      "next_hint": "string"
    }
  ]
}

## Rules

- Không được tạo stat ngoài danh sách:
  - tu_vi
  - karma
  - luck
  - physical

- Value phải nằm trong range:
  - -10 đến +10

- Không được tạo event phá logic:
  - hồi sinh
  - reset timeline