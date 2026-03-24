# Prompt & JSON mẫu — nhờ AI viết cốt truyện (The Summit Journey)

Tài liệu này để **copy nguyên khối “System + User”** cho một AI khác viết nội dung, rồi bạn (hoặc pipeline) map sang DB / seed. Khớp engine: `handleChoice`, `findNextEvent`, `event-schema.md`, `database.md`.

**Muốn copy cho n8n (50 chương, nhiều nhánh & ending):** xuống mục **«N8N — Luồng 50 chương»** bên dưới.

---

## N8N — Luồng 50 chương (copy-paste) {#n8n-copy}

### Vì sao nên tách vòng lặp trong n8n

Một lần sinh **50 chương × nhiều event × nhiều lựa chọn** dễ **vượt context / bị cắt giữa chừng**. Luồng ổn định:

1. **Node 1 — AI:** sinh **dàn bài 50 chương** (JSON nhỏ: tiêu đề, mục tiêu cốt truyện, điểm rẽ lớn, bao nhiêu ending dự kiến).
2. **Node 2 — Split in Batches** hoặc **Loop Over Items** (`chapter_index` 1…50).
3. **Node 3 — AI:** mỗi lần chỉ sinh **một chương** (đủ event + lựa chọn + điều kiện stat), kèm `entry_event_id` / `must_link_to_next` từ bước trước.
4. **Node 4 — Merge / Code:** ghép mảng `events` toàn campaign, validate `next_event_ref`.

Dưới đây vẫn có **một cặp System + User “một shot”** nếu bạn dùng model context rất dài và chấp nhận rủi ro truncate.

---

### SCHEMA OUTPUT — `campaign` (chuẩn cho import / merge)

Mọi `events[].id` **unique toàn campaign** (slug). Quy ước tên: `c{chapter_index}_` + từ khóa ngắn, ví dụ `c07_ngo_den`.

```json
{
  "campaign": {
    "title": "string",
    "language": "vi",
    "chapters": [
      {
        "chapter_index": 1,
        "chapter_title": "string",
        "summary_one_line": "string",
        "events": [
          {
            "id": "c01_suoi",
            "event_type": "normal",
            "title": "string",
            "description": "string",
            "tags": ["chapter_01", "..."],
            "pick_weight": 1,
            "choices": [
              {
                "content": "string",
                "weight": 1,
                "effects": [{ "stat": "karma", "value": -2 }],
                "conditions": [{ "stat": "tu_vi", "operator": ">", "value": 20 }],
                "next_event_ref": "c01_duong"
              }
            ]
          }
        ]
      }
    ],
    "ending_registry": [
      { "id": "c50_end_chinh_dao", "tone": "chinh_dao", "chapter_index": 50 },
      { "id": "c48_end_ma_dao", "tone": "ma_dao", "chapter_index": 48 }
    ]
  }
}
```

**Quy tắc bắt buộc (AI phải tuân thủ):**

| Quy tắc | Chi tiết |
|--------|-----------|
| Stat | Chỉ `tu_vi`, `karma`, `luck`, `physical`. |
| `effects[].value` | -10 … +10 mỗi dòng. |
| `conditions` | `operator` chỉ `">"`, `"<"`, `"="`; so với số nguyên. |
| Lựa chọn / màn | Mỗi event `normal` hoặc `encounter` có **ít nhất 3** `choices` (trừ khi meta kỹ thuật cho phép ít hơn — không khuyến nghị). |
| Nhánh stat | **Ít nhất 40%** số event trong chương có **≥1** choice với `conditions` không rỗng (khóa theo karma/tu_vi/luck/physical). |
| Nhánh cốt truyện | **Ít nhất 2** event mỗi chương có hai choice dẫn tới **`next_event_ref` khác nhau** (tách tuyến). |
| `ending` | Toàn campaign có **ít nhất 6** event `event_type: "ending"` với `id` khác nhau; mô tả + `choices` có thể 1–3 (đóng sổ hoặc nhìn lại hành trình). Mỗi ending gắn tag `ending` + `ma_dao` hoặc `chinh_dao` hoặc `neutral` tùy tone. |
| Liên chương | Event cuối chương K (không phải ending) phải có ít nhất một `next_event_ref` trỏ tới **`c{K+1}_...`** (màn mở chương K+1). Chương 50 có thể kết bằng ending. |
| `next_event_ref` | Mọi ref phải trỏ tới đúng một `events[].id` trong **cùng output** (one-shot) hoặc đã nêu trong prompt vòng lặp (cross-chapter). |
| `pick_weight` | Số nguyên ≥ 1; chỉ ảnh hưởng khi engine random pool — vẫn khai báo hợp lý. |
| Cấm | Hồi sinh, reset timeline, stat lạ. |

---

### BLOCK A — SYSTEM PROMPT (dán vào n8n “System” / “Instructions”)

Copy từ dòng `BẠN LÀ` đến hết block.

```
BẠN LÀ: biên kịch chủ đạo game text tu tiên "The Summit Journey".

NHIỆM VỤ: Xuất DUY NHẤT một JSON hợp lệ (UTF-8), không markdown, không ```, không giải thích trước/sau.

CƠ CHẾ GAME (bắt buộc khớp engine):
- Bốn stat: tu_vi, karma, luck, physical.
- effects: mỗi phần tử { "stat", "value" }, value nguyên từ -10 đến +10.
- conditions: { "stat", "operator", "value" } với operator chỉ ">", "<", "=".
- Nếu điều kiện không thỏa, người chơi KHÔNG chọn được choice đó — hãy thiết kế "cửa ẩn" theo build (karma cao/thấp, tu_vi, luck, physical).
- event_type: "normal" | "encounter" | "ending".
- next_event_ref: chuỗi id sự kiện tiếp theo; phải tồn tại trong cùng graph. Hai choice khác next_event_ref = tách tuyến. Cùng ref = cùng màn sau, khác stat/đạo đức.
- tags: luôn có "chapter_XX" theo chương; thêm ma_dao / chinh_dao khi tone màn phù hợp (ảnh hưởng pool random trong game).
- pick_weight: số nguyên ≥ 1 trên mỗi event.
- choice.weight: số nguyên ≥ 1 (dự phòng pipeline; vẫn điền).

CHẤT LƯỢNG NỘI DUNG:
- Tiếng Việt cổ nhẹ; description như văn học tiên hiệp — tả không gian, thời điểm, khí trời, áp lực trong lòng nhân vật; tránh lạm thoại dài.
- Mỗi chương là một "đoạn đường" có căng thẳng riêng; có điểm rõ: thăng, trầm, hoặc nghịch lý đạo tâm.
- Lựa chọn phải cảm nhận được hệ quả qua effects (và đôi khi qua conditions — build khác mở option khác).

CẤU TRÚC OUTPUT:
- Dùng đúng schema "campaign" với mảng chapters; mỗi chapter có chapter_index, chapter_title, summary_one_line, events[].
- ending_registry: liệt kê mọi event ending (id, tone, chapter_index).

KIỂM TRA TRƯỚC KHI GỬI:
- Mọi next_event_ref khớp id.
- Không dead-end ngoài ending (trừ khi chủ đích kết run).
- Đủ số choice / điều kiện / nhánh / ending theo USER message.
```

---

### BLOCK B — USER PROMPT — **Một lần (50 chương)** — dán vào n8n khi gọi model context cực lớn

```
Sinh full campaign JSON theo SYSTEM.

YÊU CẦU SỐ LƯỢNG:
- Đúng 50 phần tử trong campaign.chapters (chapter_index 1..50).
- Mỗi chương: 5 đến 9 event (không tính trùng id).
- Mỗi event normal/encounter: tối thiểu 3 choices.
- Mỗi chương: tối thiểu 2 event có ít nhất một cặp choice dẫn tới hai next_event_ref khác nhau.
- Mỗi chương: tối thiểu 40% số event có ≥1 choice với conditions không rỗng.
- Toàn campaign: tối thiểu 8 event event_type "ending" (id khác nhau), phân bổ ở các chương khác nhau (không dồn hết chương 50); ít nhất 3 ending "chinh_dao", 3 "ma_dao", 2 "neutral" hoặc hỗn hợp — thể hiện bằng tags và mô tả.
- Nối chương: với mọi K từ 1..49, có đường đi từ ít nhất một choice ở chương K tới id mở đầu chương K+1 (prefix id c{K+1}_).

CHỦ ĐỀ: Hành trình leo núi tu tiên, từ phàm tới ranh giới đỉnh; có phe chính tà, thử lòng, hối hận, và các kết khác nhau theo karma/build.

CHỈ TRẢ JSON.
```

---

### BLOCK C — USER PROMPT — **Vòng lặp n8n (khuyến nghị)** — thay biến `{{...}}`

Dùng sau khi đã có **outline** (hoặc cố định `entry_id`). Gán `chapter_index` từ 1 đến 50.

```
Sinh JSON cho ĐÚNG MỘT chương theo SYSTEM.

chapter_index: {{chapter_index}}
chapter_title gợi ý: {{chapter_title}}
summary cốt truyện chương này: {{chapter_summary}}

RÀNG BUỘC GRAPH:
- Event đầu tiên của chương BẮT BUỘC có id: {{entry_event_id}} (tạo nội dung mới cho id này).
- Mọi event khác trong chương: id bắt đầu bằng "c{{chapter_index}}_" và unique toàn bộ output.
- Event cuối chương (không phải ending): mọi "đường chính" phải có thể tới một choice có next_event_ref = "{{next_chapter_entry_id}}" (nếu chapter_index < 50). Nếu chapter_index = 50: các nhánh kết thúc tại một trong các ending id: {{ending_ids_allowed_csv}}.

SỐ LƯỢNG TRONG CHƯƠNG NÀY:
- 5–9 event.
- Mỗi normal/encounter: ≥3 choices.
- ≥2 event có nhánh hai next_event_ref khác nhau.
- ≥40% event có choice có conditions không rỗng.
- Nếu chapter_index thuộc {{ending_chapter_flags}}: thêm ít nhất 1 event ending trong chương.

OUTPUT: một object JSON { "chapter_index", "chapter_title", "summary_one_line", "events": [...] } — KHÔNG bọc trong campaign; merge sẽ làm ở n8n.

CHỈ TRẢ JSON.
```

**Gợi ý biến n8n (ví dụ):**

| Biến | Ý nghĩa |
|------|--------|
| `{{chapter_index}}` | 1…50 |
| `{{entry_event_id}}` | `c01_suoi` hoặc id cuối chương trước |
| `{{next_chapter_entry_id}}` | `c02_mo_dau` — cố định từ outline |
| `{{ending_ids_allowed_csv}}` | `c50_end_a,c50_end_b` khi chương 50 |

---

### BLOCK D — USER nhỏ: chỉ **outline 50 chương** (bước 1 trong n8n)

```
Trả JSON duy nhất:
{ "chapters_outline": [ { "chapter_index": 1, "chapter_title": "", "beat": "", "major_fork": "", "entry_event_id": "c01_xxx", "exit_link_to": "c02_yyy" }, ... ] }
Đúng 50 phần tử. entry/exit id unique, prefix c{N}_.
Không viết full event; chỉ dàn bài.
CHỈ TRẢ JSON.
```

---

## 1. Luật cơ học (AI bắt buộc hiểu)

### Chỉ số (`player_runs.stats`)

Chỉ được dùng **bốn** stat (tên JSON **đúng chữ**):

| Khóa JSON   | Ý nghĩa gợi ý |
|-------------|----------------|
| `tu_vi`     | Tu vi / tu hành, nội lực đạo |
| `karma`     | Thiện–ác / nhân quả; **ảnh hưởng pool** khi game random màn kế (`karma < -20` → ưu tiên tag `ma_dao`; `karma > 20` → `chinh_dao`) |
| `luck`      | May rủi, cơ duyên |
| `physical`  | Thể lực, chịu đựng |

**Cách stat “đi vào” lựa chọn:**

1. **`effects`** — mỗi dòng `{ "stat", "value" }` cộng vào stat sau khi chọn (có thể nhiều dòng / một lựa chọn).
2. **`conditions`** — nếu **không** thỏa, người chơi **không được chọn** lựa chọn đó (toán tử chỉ dùng: `">"`, `"<"`, `"="`).

**Giới hạn cộng/trừ mỗi effect (theo `event-schema.md`):** `value` từ **-10 đến +10** (mỗi dòng).

### Hai loại “trọng số” — **không nhầm lẫn**

| Trường            | Thuộc   | Ý nghĩa trong game **hiện tại** |
|-------------------|---------|----------------------------------|
| `choice.weight`   | Lựa chọn | **Chưa** dùng trong engine lượt người chơi; có thể để sẵn (mặc định 1) cho pipeline/NPC sau. |
| `event.pick_weight` | Sự kiện | Khi **không** có `next_event_id` cố định và engine **random** màn kế — tỉ lệ xuất hiện trong pool (số càng lớn càng hay được chọn). Mặc định 1. |

### Nhánh cốt truyện

- **`next_event_id`** (trong DB) = id số của màn tiếp theo. Trong JSON soạn thảo bạn có thể dùng **`next_event_ref`** (chuỗi) trỏ tới `events[].id` trong cùng file — người import sẽ đổi thành id số.
- Hai lựa chọn **cùng** `next_event_ref` → cùng màn tiếp, **khác** chỉ số / điều kiện (điển hình “cùng đích, khác căn cốt”).
- Hai lựa chọn **khác** `next_event_ref` → **tách nhánh** thật.

### Loại sự kiện

`event_type`: `"normal"` | `"encounter"` | `"ending"`  
- `ending`: thường dùng để khép chặng; nếu `next_event_id` / ref trống sau ending thì có thể kết thúc run (theo engine).

### Tag

`tags` là mảng string — dùng cho lọc random (`ma_dao`, `chinh_dao`) và lọc nội dung. Nên có tag **chapter** / **địa điểm** tùy bạn.

### Cấm (theo spec)

- Không hồi sinh, không reset timeline, không tạo stat ngoài bốn loại trên.

---

## 2. JSON mẫu — **một file nhiều màn** (khuyến nghị cho AI viết batch)

AI output **một object** gồm `events` là mảng. Mỗi phần tử có `id` **ổn định** (slug, ví dụ `ch01_suoi`) để các `choices[].next_event_ref` trỏ tới.

```json
{
  "meta": {
    "title": "Tên gói nội dung / chương",
    "language": "vi",
    "notes_for_human": "Ghi chú import: merge vào DB, không tự động có id số."
  },
  "events": [
    {
      "id": "ch01_suoi",
      "event_type": "normal",
      "title": "Bờ suối linh khí",
      "description": "Đoạn mô tả 2–6 câu. Có thể xuống dòng bằng \\n.",
      "tags": ["chapter_01", "intro", "tutorial_stats"],
      "pick_weight": 1,
      "choices": [
        {
          "content": "Hít thở theo nhịp nước, rèn thân.",
          "weight": 1,
          "effects": [{ "stat": "physical", "value": 2 }],
          "conditions": [],
          "next_event_ref": "ch01_duong_mon"
        },
        {
          "content": "Ngồi kết ấn, dẫn khí vào đan điền.",
          "weight": 1,
          "effects": [{ "stat": "tu_vi", "value": 1 }],
          "conditions": [],
          "next_event_ref": "ch01_duong_mon"
        }
      ]
    },
    {
      "id": "ch01_duong_mon",
      "event_type": "normal",
      "title": "Con đường mòn",
      "description": "Hai lối: một lên đồi, một xuống thung lũng — cùng núi xa.",
      "tags": ["chapter_01", "path_fork"],
      "pick_weight": 1,
      "choices": [
        {
          "content": "Leo đồi, chịu gió.",
          "weight": 1,
          "effects": [{ "stat": "physical", "value": 1 }],
          "conditions": [],
          "next_event_ref": "ch01_encounter"
        },
        {
          "content": "Xuống thung lũng — lối tắt tới chỗ có người.",
          "weight": 1,
          "effects": [{ "stat": "luck", "value": 1 }],
          "conditions": [],
          "next_event_ref": "ch01_lao_nhan"
        }
      ]
    },
    {
      "id": "ch01_encounter",
      "event_type": "encounter",
      "title": "Tiếng động trong bụi",
      "description": "…",
      "tags": ["chapter_01", "encounter", "ma_dao"],
      "pick_weight": 2,
      "choices": [
        {
          "content": "Ẩn mình quan sát.",
          "weight": 1,
          "effects": [
            { "stat": "karma", "value": 1 },
            { "stat": "tu_vi", "value": 1 }
          ],
          "conditions": [],
          "next_event_ref": "ch01_lao_nhan"
        },
        {
          "content": "Bước ra đối diện.",
          "weight": 1,
          "effects": [
            { "stat": "physical", "value": 1 },
            { "stat": "karma", "value": -1 }
          ],
          "conditions": [],
          "next_event_ref": "ch01_lao_nhan"
        }
      ]
    },
    {
      "id": "ch01_lao_nhan",
      "event_type": "normal",
      "title": "Lão nhân gánh củi",
      "description": "…",
      "tags": ["chapter_01", "npc", "chinh_dao"],
      "pick_weight": 1,
      "choices": [
        {
          "content": "Chỉ lựa chọn dành cho karma âm sâu.",
          "weight": 1,
          "effects": [{ "stat": "karma", "value": -1 }],
          "conditions": [{ "stat": "karma", "operator": "<", "value": -10 }],
          "next_event_ref": "ch01_tiep"
        },
        {
          "content": "Lựa chọn mặc định.",
          "weight": 1,
          "effects": [{ "stat": "karma", "value": 1 }],
          "conditions": [],
          "next_event_ref": "ch01_tiep"
        }
      ]
    },
    {
      "id": "ch01_tiep",
      "event_type": "normal",
      "title": "…",
      "description": "…",
      "tags": ["chapter_01"],
      "pick_weight": 1,
      "choices": []
    }
  ]
}
```

**Quy ước:**

- Mọi `next_event_ref` phải khớp **đúng** một `events[].id` trong file (trừ khi bạn cho phép `null` = để engine random / kết thúc — ghi rõ trong `meta`).
- `choices` rỗng chỉ dùng nếu bạn thiết kế màn “kết” xử lý khác — thường nên có ít nhất 1 lựa chọn hoặc đánh dấu `event_type: "ending"`.

---

## 3. JSON mẫu — **một màn** (khớp `event-schema.md` — dùng cho generative / đơn lẻ)

Khi chỉ sinh **một** event (ví dụ AI runtime), dùng form phẳng sau; `next_hint` là gợi ý văn bản cho người thiết kế, **không** thay thế `next_event_id` trong DB.

```json
{
  "event": {
    "title": "string",
    "description": "string"
  },
  "event_type": "normal",
  "tags": ["tag_a", "tag_b"],
  "pick_weight": 1,
  "choices": [
    {
      "content": "string",
      "weight": 1,
      "effects": [{ "stat": "tu_vi", "value": 5 }],
      "conditions": [{ "stat": "karma", "operator": "<", "value": 0 }],
      "next_hint": "Gợi ý: màn tiếp nên là hang động / thử thân"
    }
  ]
}
```

---

## 4. Prompt master (copy dán cho AI viết cốt)

Dưới đây là **một khối** bạn có thể dùng làm **System** hoặc **đầu User**.

```
Bạn là biên kịch game text-based tu tiên (The Summit Journey). Nhiệm vụ: viết cốt truyện dài khoảng 10h chơi theo JSON, không giải thích ngoài JSON.

QUY TẮC KỸ THUẬT:
- Chỉ bốn stat: tu_vi, karma, luck, physical.
- Mỗi effect: value từ -10 đến +10 (mỗi dòng).
- conditions: chỉ operator ">", "<", "=" so với số nguyên.
- Mỗi lựa chọn có: content, weight (số nguyên ≥ 1), effects[], conditions[], next_event_ref (chuỗi khớp events[].id trong file) HOẶC null nếu meta cho phép random/kết thúc.
- event_type: "normal" | "encounter" | "ending".
- tags: mảng string; nếu muốn karma đen/trắng ảnh hưởng pool sau này, gắn tag ma_dao hoặc chinh_dao cho đúng màn.
- pick_weight: số nguyên ≥ 1 trên mỗi event — cao hơn = hay được engine chọn hơn khi RANDOM màn (không áp khi đã có next cố định).
- Không: hồi sinh, reset timeline, stat ngoài bốn loại.

PHONG CÁCH:
- Tiếng Việt cổ nhẹ, gọn; mô tả có hình khí, ít thoại dài.
- Phần mô tả (Description) chú ý viết chi tiết, đi vào tả cảnh, môi trường,... như trong 1 tác phẩm văn học, tiên hiệp để người chơi cảm nhận được không gian, thời gian khi sự việc, sự kiện xảy ra
- Lựa chọn phải đọc được hệ quả đạo đức / thể xác / tu vi rõ trong effects, mang tính chiều sâu cao.

OUTPUT:
- Chỉ một object JSON hợp lệ, theo schema "events" mảng (batch) HOẶC một object một-màn nếu tôi yêu cầu rõ.
- Không markdown, không ``` bọc quanh.
```

**User message mẫu (điền phần trong ngoặc):**

```
Viết [N] màn thuộc [chương / đoạn đường núi …]. 
Bắt đầu từ id sự kiện "[id_bắt_đầu]", kết thúc nhánh tại "[id_kết]".
Có ít nhất một chỗ hai lựa chọn dẫn tới next_event_ref khác nhau.
Có ít nhất một lựa chọn có conditions (ví dụ karma < 0).
JSON theo .cursor/docs/story-authoring-prompt.md (mảng events).
```

---

## 5. Sau khi AI trả JSON

1. Validate: mọi `next_event_ref` tồn tại; không có vòng lạ; `effects` trong [-10, 10].
2. Map `events[].id` → `events.id` (serial) trong PostgreSQL; thay `next_event_ref` → `next_event_id`.
3. Import `choice.weight`, `event.pick_weight` nếu dùng migration/seed.
4. Luồng n8n lặp từng chương: ghép `events` từ 50 file/partial thành một mảng; kiểm tra ref **xuyên chương** (`c12_*` → `c13_*`).

---
