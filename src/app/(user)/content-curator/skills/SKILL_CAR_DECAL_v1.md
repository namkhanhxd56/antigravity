---
name: skill-car-decal
description: "Product skill for writing Amazon US listings for car decals & car stickers (vinyl decals for car window, windshield, bumper, truck, SUV, RV, motorcycle, helmet, boat, laptop, tumbler, etc). Use this skill when the user wants to create Amazon listing content (title, bullet points, description) for car decal / car sticker / bumper sticker / window decal / vinyl car decal products. Triggers: any mention of 'car decal listing', 'car sticker listing', 'bumper sticker', 'window decal', 'viết listing car decal', 'amazon car decal content', product images of decal designs for vehicles, or requests to generate title/bullets/description for car decal products. This skill includes image analysis to auto-detect decal count, theme, size, and niche from uploaded product images."
---

# SKILL: CAR DECAL (Vinyl Car Sticker / Bumper Sticker / Window Decal)

> **Version:** 1.0
> **Based on:** Top winning Amazon US car decal listings analysis
> **Applies to:** Vinyl decals for car window, windshield, bumper, truck, SUV, RV, motorcycle, helmet, boat, laptop, tumbler, water bottle...

---

Skill này áp dụng **Base Rules** (lưu trong memory): keyword quan trọng nhất đứng đầu title, mỗi keyword xuất hiện đúng 1 lần trong toàn listing, chỉ dùng Exact/Phrase match, không ®©™.

**Keyword flow:** Title → Bullet Points → Description

> ⚠️ **Khác biệt cốt lõi so với sticker đa năng:** Car decal có vị trí dán chính là PHƯƠNG TIỆN (car/truck/SUV/window/bumper) chứ không phải laptop/water bottle. Số lượng phổ biến 1–2 Pcs, kích thước lớn 5–8 inches, và nhấn mạnh độ bền ngoài trời (UV, weatherproof, outdoor-grade, no residue on car paint).

---

## IMAGE

Khi người dùng upload hình ảnh sản phẩm, PHẢI phân tích trước khi viết listing.

### Các bước phân tích

**1. Đếm số lượng decal**
- Đếm số design riêng biệt → dùng làm `(X Pcs)` trong title
- Car decal phổ biến: 1 Pcs (single piece) hoặc 2 Pcs (pair / left-right)
- Nếu set nhiều: 3-4 Pcs
- Nếu không rõ → để decal_count = null

**2. Ước lượng kích thước**
- Đo tỉ lệ decal so với bề mặt mẫu (nếu có)
- Kích thước phổ biến: 4", 5", 6", 8" (lớn hơn sticker thường)
- Bumper sticker / windshield: thường 6–8 inches
- Window cling nhỏ: 3–5 inches

**3. Xác định chủ đề / theme**
- Nhận diện nội dung chính: nhân vật, biểu tượng, text/quote, phong cách minh họa
- Xác định tone: faith/religious, patriotic, funny, awareness, memorial, cute animal, sport
- Ghi nhận chi tiết thiết kế: màu sắc chủ đạo (white/black/full-color), kiểu cut (die-cut/kiss-cut), có background hay transparent

**4. Đọc text trên decal**
- Đọc và ghi lại chính xác mọi text/quote
- Text này sẽ dùng trong BP1 và Description

**5. Xác định niche**

| Dấu hiệu nhận diện | Niche |
|---------------------|-------|
| Cross, Bible verse, "Faith", "Jesus", "God", praying hands | Faith/Christian |
| US flag, eagle, "We the People", "2A", military, blue line, red line | Patriotic/Military |
| Cat/dog/cute animal, paw print, "Dog Mom", windshield wiper cat | Pet/Animal |
| Ribbon, awareness color, autism puzzle, "On Board" sign | Awareness/Family Safety |
| Meme, sarcastic quote, dark humor, funny character | Funny/Sarcastic |
| Angel wings, "In Memory of", memorial date, RIP | Memorial/Tribute |
| Sport logo, ball, team name, jersey number | Sport/Hobby |
| Skull, flame, racing stripe, JDM, off-road | Auto Style/Racing |

### Output sau phân tích

Trình bày kết quả trước khi viết listing:
```
📦 Số lượng: X Pcs
📏 Kích thước ước lượng: X inches
🎨 Chủ đề: [mô tả ngắn]
🏷️ Niche: [Faith/Patriotic/Pet/Awareness/Funny/Memorial/Sport/Auto Style]
📝 Text trên decal: ["quote 1", "quote 2", ...]
🎯 Chi tiết thiết kế: [màu, die-cut/kiss-cut, transparent/background, style minh họa]
🚗 Vị trí dán đề xuất chính: [window/bumper/windshield/hood/tailgate]
```

---

## TITLE

**Giới hạn:** tối đa 200 ký tự

### Công thức chuẩn

```
(Số lượng) + [Keyword Root] + [Long-tail Keyword] - Tính chất nổi bật + Chất liệu + Danh sách bề mặt (xe trước, đồ khác sau) + [Keyword Broad] + Kích thước
```

### 3 loại keyword trong title

| Loại | Định nghĩa | Ví dụ |
|------|-----------|-------|
| **Keyword Root** | Keyword chính = niche + sản phẩm car, search volume cao nhất | `Faith Car Decal`, `Cute Cat Car Sticker`, `Christian Car Decal`, `American Flag Bumper Sticker` |
| **Long-tail Keyword** | Từ khoá dài, cụ thể hơn | `Faith Can Move Mountains Decal`, `Cat Windshield Wiper Decal`, `Stand for The Flag Kneel for The Cross` |
| **Keyword Broad** | Từ khoá mở rộng — chỉ thêm nếu còn dư ký tự | `Vinyl Car Decals`, `Bumper Stickers for Cars`, `Window Decals for Cars and Trucks`, `Car Accessories` |

### Các thành phần theo thứ tự ưu tiên

| Vị trí | Thành phần | Tần suất | Ví dụ |
|--------|-----------|---------|-------|
| 1 | Số lượng `(XPcs)` — lấy từ ảnh | 60% | `(2Pcs)`, `(2 Pcs)` |
| 2 | **Keyword Root** (niche + car decal/sticker) | 100% | `Faith Christian Car Decal` |
| 3 | **Long-tail Keyword** | Nên có | `Faith Can Move Mountains Vinyl Sticker` |
| 4 | Dấu `-` hoặc `\|` phân tách | — | — |
| 5 | Tính chất nổi bật | 80% | `Waterproof`, `UV-Resistant`, `Weatherproof`, `Die-Cut` |
| 6 | Chất liệu "Vinyl Decal" / "Premium Vinyl" | 90% | `Vinyl Decal`, `Premium Vinyl Sticker` |
| 7 | **Danh sách bề mặt** (XE trước, đồ khác sau) | 100% | `for Car, Truck, Window, Bumper, Laptop` |
| 8 | **Keyword Broad** (nếu còn dư) | Tùy chọn | `Car Accessories`, `Bumper Stickers` |
| 9 | Kích thước | 70% | `6 Inches`, `8" x 3"`, `5 Inch` |
| 10 | Màu sắc (nếu có biến thể) | 30% | `(White)`, `\| Black` |

### Bề mặt phổ biến trong Title (CAR DECAL khác sticker thường)

| Bề mặt | Tần suất | Ghi chú |
|--------|---------|---------|
| Car | 100% | Luôn có — đặt đầu danh sách |
| Truck | 76% | Nên có |
| Window / Car Window | 70% | Cho window decal |
| Bumper / Car Bumper | 65% | Cho bumper sticker |
| Windshield | 35% | Cho windshield decal |
| SUV | 30% | Mở rộng |
| Laptop | 53% | Cross-use, thêm sau |
| Tumbler / Water Bottle | 30% | Cross-use |
| Wall | 25% | Cho quote decal |
| Motorcycle / Helmet | 20% | Cho niche racing/auto |
| Boat / RV | 15% | Outdoor niche |

### Ví dụ Title theo niche

**Faith/Christian:**
```
(2Pcs) Faith Christian Car Decal - Faith Can Move Mountains Jesus Cross Vinyl Sticker Waterproof for Car, Truck, Window, Bumper, Laptop - Christian Car Accessories - 8 Inches
```

**Patriotic:**
```
Stand for The Flag Kneel for The Cross Car Decal - Patriotic Vinyl Sticker Waterproof UV-Resistant for Car, Truck, Bumper, Window, Laptop - American Flag Bumper Stickers - 5 Inches
```

**Pet/Cute Animal:**
```
(2 Pcs) Cute Cat Car Decals - Cat Windshield Wiper Vinyl Sticker Waterproof Die-Cut for Car Window, Bumper, Truck, Laptop - Funny Car Accessories for Cat Lovers - 6 Inches
```

**Awareness/Family Safety:**
```
(2Pcs) Autism Awareness Car Decal - Autistic Child On Board Vinyl Sticker Waterproof for Car, Truck, Bumper, Window, SUV - Autism Car Accessories - 4 Inches
```

**Memorial/Tribute:**
```
In Loving Memory Car Decal - Angel Wings Memorial Vinyl Sticker Waterproof Custom Tribute for Car, Truck, Window, Bumper, Laptop - Memorial Car Accessories - 6 Inches
```

---

## BULLET POINTS

### Quy tắc chung
- KHÔNG dùng emoji — Amazon không hỗ trợ ký tự đặc biệt
- Header: IN HOA hoặc Title Case, 2–5 từ
- Nội dung: nhồi keyword Exact/Phrase chưa dùng ở title, viết tự nhiên
- Nên viết 350–450 ký tự/bullet

### Template 5 Bullets

#### BP1 — Design/Theme Description
Giới thiệu decal và điểm nổi bật thiết kế — dùng thông tin từ phân tích ảnh (chủ đề, text trên decal, style minh họa). **Nhồi tối thiểu 3 keywords available chưa dùng ở title.**

```
[MEANINGFUL DESIGN]: [Tên thiết kế] car decal features [mô tả design từ ảnh]. [Text/quote trên decal]. A bold statement piece for your vehicle that [showcases values / expresses personality / honors loved ones]. [≥3 keyword chưa dùng].
```

#### BP2 — Target Audience & Vehicle Compatibility
Mô tả đối tượng sử dụng + loại xe phù hợp. **Nhồi tối thiểu 2 keywords available chưa dùng.**

```
[PERFECT FOR]: Ideal for [đối tượng: drivers / truckers / families / Christians...]. Fits perfectly on [loại xe: cars, trucks, SUVs, RVs, motorcycles, jeeps]. [Dịp/tình huống phù hợp]. [≥2 keyword chưa dùng].
```

Audiences theo niche:
- Faith/Christian: Christians, Catholic community, church members, faith-driven drivers, Christian moms/dads
- Patriotic/Military: veterans, military families, first responders, patriots, conservatives, Trump supporters, 2A supporters
- Pet/Animal: cat lovers, dog moms/dads, animal lovers, pet owners, cat ladies
- Awareness/Family Safety: parents, caregivers, autism families, special needs advocates
- Funny/Sarcastic: drivers with humor, coworkers, friends, men/women looking for unique car accessories
- Memorial: bereaved families, memorial gift recipients, those honoring lost loved ones
- Sport/Hobby: sport fans, team supporters, athletes, coaches
- Auto Style: car enthusiasts, JDM fans, off-road drivers, racing fans, truck owners

#### BP3 — Versatile Surfaces + Quality/Material *(KEYWORD STUFFING ZONE)*
Kết hợp 2 nội dung: (1) bề mặt **mới chưa có trong title** + nhấn mạnh phương tiện, (2) đặc tính chất liệu chuyên cho ngoài trời.

Bề mặt mới: rear window, side window, tailgate, hood, gas tank cover, mirror, motorcycle helmet, boat hull, RV, trailer, jet ski, golf cart, skateboard, locker, mailbox, toolbox, cooler, fridge

Quality keywords cho CAR (mạnh hơn sticker thường):
- waterproof, UV-resistant, weatherproof, fade-resistant, scratch-proof
- outdoor-grade, premium vinyl, ORACAL vinyl, automotive-grade
- lasts 5–7 years outdoors, won't crack/peel, sun-resistant
- no residue, removable, safe for car paint

```
[DURABLE & WEATHERPROOF]: Apply to [danh sách bề mặt mới: rear window, tailgate, hood, mirror, helmet, RV...]. Made from premium outdoor-grade vinyl with waterproof, UV-resistant, and fade-resistant properties. Lasts 5-7 years outdoors without cracking, peeling, or fading — safe for car paint with no sticky residue when removed.
```

#### BP4 — Easy Application
Keywords: die-cut, kiss-cut, peel-and-stick, transfer tape, application instructions, bubble-free, smooth surface, no water needed, repositionable, no residue

Hướng dẫn cụ thể cho CAR (khác sticker laptop):
1. Clean the surface with alcohol or soap water, dry completely
2. Peel the backing carefully
3. Apply to a smooth, flat surface (avoid curved/textured areas)
4. Press firmly from center outward to remove air bubbles
5. Slowly peel off transfer tape (if die-cut)

```
[EASY PEEL & STICK APPLICATION]: Die-cut vinyl decal with transfer tape for precise placement. Simply clean the surface, peel the backing, apply to your car window/bumper/truck, and smooth out from center. Removes cleanly with no residue — won't damage car paint or glass. Detailed instructions included.
```

#### BP5 — Gift/Occasion
Audiences: car owners, new drivers, truckers, dads, moms, friends, coworkers, family members
Occasions: birthdays, Christmas, Father's Day, Mother's Day, graduation gift, new car gift, stocking stuffers, memorial keepsake

```
[GREAT GIFT FOR CAR LOVERS]: A meaningful gift for [đối tượng: dad, mom, friend, truck owner, new driver]. Perfect for [dịp: birthdays, Christmas, Father's Day, new car gift, graduation]. [Keyword còn lại — e.g. car accessories for men/women, bumper stickers for trucks].
```

### Điều chỉnh theo niche

| Niche | Keyword ưu tiên ở BP1 | Đối tượng ở BP2 | Bề mặt ưu tiên ở BP3 | Gift angle ở BP5 |
|-------|----------------------|----------------|----------------------|-----------------|
| Faith/Christian | faith, christian, jesus, cross, bible verse, religious | Christians, church members, faith-driven drivers | Rear window, bumper, tailgate | Dad, mom, friend, baptism, confirmation |
| Patriotic/Military | patriotic, american flag, military, veteran, 2A, freedom | Veterans, first responders, patriots | Truck tailgate, bumper, hood | Veteran dad, military family, July 4th |
| Pet/Animal | cute, cat, dog, animal, paw, pet | Pet owners, cat ladies, dog moms | Windshield, side window, bumper | Cat/dog lover, pet parent, animal rescue |
| Awareness/Family Safety | awareness, on board, autism, support, advocate | Parents, caregivers, families | Rear window, bumper, back of car | Parents, caregivers, teachers |
| Funny/Sarcastic | funny, sarcastic, humor, meme | Drivers with humor, coworkers, friends | Bumper, tailgate, rear window | Coworker, friend, white elephant gift |
| Memorial | memorial, in loving memory, tribute, angel | Bereaved families, memorial recipients | Rear window, back glass | Sympathy gift, anniversary of loss |
| Sport/Hobby | [sport name], team, fan, player | Sport fans, athletes, coaches | Bumper, rear window, helmet | Teammate, fan, season opener |
| Auto Style/Racing | racing, JDM, off-road, performance | Car enthusiasts, truck owners | Hood, windshield, tailgate | Car guy, gearhead, birthday gift |

---

## DESCRIPTION

### Quy tắc
- Viết bằng tiếng Anh, tuân thủ quy định bán hàng trên Amazon
- Nhồi keyword còn lại chưa dùng ở title + bullets
- Viết dạng đoạn văn (paragraph), KHÔNG dùng bullet points
- Viết đơn giản, dễ đọc — độ dài khuyến nghị: 600–1000 ký tự
- Dùng thông tin phân tích ảnh để mô tả sản phẩm
- Nhấn mạnh: outdoor durability, vehicle compatibility, meaningful design, gift potential

### Cấu trúc gợi ý (có thể lược bỏ đoạn nếu không cần thiết)

```
Đoạn 1: Hook + tổng quan decal (keyword biến thể chưa dùng)
        Ví dụ: "Show your faith / patriotism / personality on the road with..."

Đoạn 2: Chi tiết design + ý nghĩa (mô tả từ ảnh + keyword niche)
        Ví dụ: mô tả text/symbol trên decal và thông điệp nó truyền tải

Đoạn 3: Chất lượng vinyl + độ bền outdoor (keyword waterproof/UV/automotive-grade)
        Ví dụ: chất liệu, tuổi thọ ngoài trời, an toàn cho sơn xe

Đoạn 4: Vehicle compatibility + bề mặt (liệt kê thêm xe và đồ vật)
        Ví dụ: cars, trucks, SUVs, RVs, motorcycles, jeeps, helmets, laptops, tumblers

Đoạn 5: Gift/CTA — kêu gọi mua, gợi ý dịp tặng quà
```

### Description mẫu

```
Express your faith on every journey with our Faith Can Move Mountains Christian Car Decal. This premium vinyl sticker features a bold cross design paired with the powerful scripture "Faith Can Move Mountains" — a meaningful daily reminder for Christian drivers and a beautiful way to share your beliefs with the world.

Crafted from automotive-grade outdoor vinyl, this car decal is engineered to withstand the harshest conditions. The weatherproof, UV-resistant, and fade-resistant material ensures your decal maintains its vibrant appearance for 5-7 years outdoors — no cracking, peeling, or fading even after years of sun, rain, and snow exposure. The die-cut precision and transparent background give a clean, professional look on any surface.

Apply easily to your car window, bumper, truck tailgate, SUV rear glass, motorcycle helmet, RV, boat, laptop, water bottle, or any smooth flat surface. The strong adhesive holds firmly to glass, metal, plastic, and painted surfaces, yet removes cleanly with no sticky residue — completely safe for your car paint.

A thoughtful Christian gift for dad, mom, husband, wife, friends, pastors, and church members. Perfect for birthdays, Christmas, Father's Day, Mother's Day, baptism, confirmation, or a meaningful "new car" gift. Order now and let your vehicle become a rolling testimony of faith.
```

---

## CHECKLIST TRƯỚC KHI XUẤT LISTING

- [ ] Đã phân tích ảnh: số lượng, kích thước, theme, niche, text trên decal
- [ ] Title ≤ 200 ký tự, có Keyword Root đứng đầu
- [ ] Title chứa ít nhất 3 bề mặt xe (Car + Truck/Window/Bumper/...)
- [ ] Mỗi keyword chỉ xuất hiện 1 lần trong toàn listing
- [ ] 5 Bullets đầy đủ: Design → Audience → Surface+Quality → Application → Gift
- [ ] BP3 nhấn mạnh outdoor durability (waterproof, UV, 5-7 years)
- [ ] BP4 có hướng dẫn application cho car (clean → peel → apply → smooth)
- [ ] Description 600–1000 ký tự, paragraph form, không bullet
- [ ] Không dùng emoji, không ®©™
- [ ] Đã nhấn mạnh "safe for car paint, no residue"
