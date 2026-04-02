export const metadata = { title: "FBA Label Tool — Hướng dẫn sử dụng" };

export default function FbaLabelGuidePage() {
  return (
    <>
      <style>{`
        body {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-size: 15px;
          color: #1a1a1a;
          background: #ffffff;
          max-width: 820px;
          margin: 0 auto;
          padding: 40px 28px 80px;
          line-height: 1.7;
        }
        .doc-header {
          background: #0594c8;
          color: white;
          border-radius: 12px;
          padding: 32px 36px;
          margin-bottom: 40px;
        }
        .doc-header h1 { margin: 0 0 6px; font-size: 26px; font-weight: 700; }
        .doc-header p  { margin: 0; font-size: 13px; opacity: 0.8; }
        .toc {
          background: #f5f9fc;
          border: 1px solid #d0e8f5;
          border-radius: 10px;
          padding: 20px 24px;
          margin-bottom: 40px;
        }
        .toc h2 { margin: 0 0 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0594c8; }
        .toc ol  { margin: 0; padding-left: 20px; }
        .toc li  { margin: 5px 0; font-size: 14px; }
        .toc a   { color: #0594c8; text-decoration: none; }
        .toc a:hover { text-decoration: underline; }
        h2 {
          font-size: 19px;
          font-weight: 700;
          color: #0594c8;
          margin: 40px 0 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #d0e8f5;
        }
        h3 { font-size: 15px; font-weight: 700; color: #0d2d3a; margin: 24px 0 8px; }
        p { margin: 8px 0; }
        .flow {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0;
          margin: 20px 0;
        }
        .flow-step {
          background: #0594c8;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          min-width: 80px;
        }
        .flow-step small { display: block; font-size: 10px; font-weight: 400; opacity: 0.85; margin-top: 2px; }
        .flow-arrow { color: #9dd0e8; font-size: 18px; padding: 0 6px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
        th { background: #0594c8; color: white; padding: 10px 14px; text-align: left; font-weight: 600; }
        td { border: 1px solid #d0e8f5; padding: 10px 14px; vertical-align: top; }
        tr:nth-child(even) td { background: #f5f9fc; }
        .steps { margin: 12px 0; padding: 0; list-style: none; }
        .steps li { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
        .step-num {
          background: #0594c8;
          color: white;
          font-weight: 700;
          font-size: 12px;
          min-width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .step-body { flex: 1; }
        .step-body strong { display: block; font-size: 14px; color: #0d2d3a; margin-bottom: 2px; }
        .step-body span { font-size: 13px; color: #444; }
        ul { padding-left: 20px; margin: 8px 0; }
        li { margin: 5px 0; }
        code {
          font-family: "Courier New", monospace;
          font-size: 13px;
          background: #f0f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          color: #0d2d3a;
        }
        .callout {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 16px;
          border-radius: 8px;
          margin: 14px 0;
          font-size: 14px;
        }
        .callout-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .callout-body { flex: 1; }
        .callout.info   { background: #e8f4fb; border-left: 4px solid #0594c8; }
        .callout.warn   { background: #fef9e7; border-left: 4px solid #f0c040; }
        .callout.danger { background: #fdecea; border-left: 4px solid #e05a5a; }
        .scenario {
          border: 1px solid #d0e8f5;
          border-radius: 10px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .scenario-head {
          background: #eaf6fd;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 700;
          color: #066e96;
          border-bottom: 1px solid #d0e8f5;
        }
        .scenario-body { padding: 12px 16px; font-size: 14px; }
        .scenario-body ul { margin: 8px 0; }
        .badge-soon {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          background: #fef9e7;
          color: #92620a;
          border: 1px solid #f0c040;
          border-radius: 4px;
          padding: 1px 7px;
          margin-left: 8px;
          vertical-align: middle;
        }
        .doc-footer {
          margin-top: 48px;
          text-align: center;
          font-size: 12px;
          color: #9bb;
          border-top: 1px solid #e8f4fb;
          padding-top: 20px;
        }
      `}</style>

      <div className="doc-header">
        <h1>🏷 FBA Label Tool</h1>
        <p>Hướng dẫn sử dụng · PDF → Edit → PNG → ZIP · v4 (Web App)</p>
      </div>

      <div className="toc">
        <h2>Mục lục</h2>
        <ol>
          <li><a href="#s1">Tổng quan &amp; luồng xử lý</a></li>
          <li><a href="#s2">Hướng dẫn sử dụng giao diện</a></li>
          <li><a href="#s3">Các trường hợp sử dụng</a></li>
          <li><a href="#s4">Sơ đồ luồng xử lý</a></li>
          <li><a href="#s5">Xử lý sự cố thường gặp</a></li>
        </ol>
      </div>

      <h2 id="s1">1. Tổng quan &amp; luồng xử lý</h2>
      <p>
        FBA Label Tool là công cụ web xử lý hàng loạt label FBA Amazon: tách trang PDF, nhận diện mã FNSKU,
        thêm text tuỳ chỉnh, xuất ảnh PNG 300 DPI và đóng gói ZIP để tải về.
      </p>
      <div className="callout info">
        <span className="callout-icon">ℹ</span>
        <div className="callout-body">
          Tool chạy hoàn toàn trên trình duyệt — không cần cài đặt Python hay bất kỳ phần mềm nào.
          Chỉ cần truy cập đường link và bắt đầu dùng ngay.
        </div>
      </div>
      <div className="flow">
        <div className="flow-step">📄 PDF<small>Nhiều trang</small></div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">✂ Tách<small>từng trang</small></div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">🔍 FNSKU<small>nhận diện</small></div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">✏ Text<small>tuỳ chọn</small></div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">🖼 PNG<small>300 DPI</small></div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">⬇ ZIP<small>tải về</small></div>
      </div>

      <h2 id="s2">2. Hướng dẫn sử dụng giao diện</h2>
      <table>
        <thead><tr><th>Khu vực</th><th>Chức năng</th></tr></thead>
        <tbody>
          <tr>
            <td><strong>① Upload file PDF</strong></td>
            <td>
              Kéo thả hoặc click để chọn file PDF. Sau khi upload, tool tự động đọc và liệt kê
              FNSKU tìm được trên từng trang. Giới hạn tối đa 50MB.
            </td>
          </tr>
          <tr>
            <td><strong>② Tuỳ chọn</strong></td>
            <td>
              Bật/tắt chức năng thêm text lên label. Khi bật, điền nội dung text và
              toạ độ X/Y (đơn vị: points). Quy đổi: <strong>1mm ≈ 2.84pt</strong>.
            </td>
          </tr>
          <tr>
            <td><strong>③ Google Drive</strong><span className="badge-soon">Phase 2</span></td>
            <td>
              Chức năng tự động đẩy ảnh lên Google Drive và ghi link vào Google Sheet
              sẽ được triển khai ở phiên bản tiếp theo.
            </td>
          </tr>
          <tr>
            <td><strong>▶ Chạy &amp; Log</strong></td>
            <td>
              Bấm <strong>Bắt đầu xử lý</strong> để chạy toàn bộ. Log hiển thị realtime.
              Sau khi xong, file <code>fba_labels.zip</code> tự động tải về.
              Bấm <strong>⬇ Tải lại</strong> để tải lại ZIP mà không cần xử lý lại.
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="s3">3. Các trường hợp sử dụng</h2>
      {[
        {
          title: "Trường hợp 1 — Có thêm text (MADE IN VIETNAM...)",
          desc: 'Dùng khi cần in label có chữ tuỳ chỉnh.',
          items: [
            'Upload file PDF chứa FBA label',
            'Bật toggle "Thêm text lên label", điền nội dung text và tọa độ X/Y',
            'Bấm "Bắt đầu xử lý"',
            'File ZIP tự động tải về — mỗi label là 1 ảnh PNG 300 DPI',
          ],
        },
        {
          title: "Trường hợp 2 — Chỉ convert PDF → PNG, không thêm text",
          desc: "Dùng khi chỉ cần tách từng trang PDF thành ảnh PNG.",
          items: [
            'Tắt toggle "Thêm text lên label"',
            'Upload PDF → Bấm "Bắt đầu xử lý"',
            "File ZIP tải về gồm các ảnh PNG gốc không có text",
          ],
        },
        {
          title: "Trường hợp 3 — Căn chỉnh vị trí text",
          desc: "Dùng khi cần xác định tọa độ X/Y để text nằm đúng vị trí trên label.",
          items: [
            "Upload PDF",
            "Bật toggle, điền tọa độ X và Y thử nghiệm",
            'Bấm "Bắt đầu xử lý" để xem kết quả trên ảnh PNG đầu tiên',
            "Nếu lệch, điều chỉnh X/Y và xử lý lại",
            "Gợi ý: Label 40×30mm = 113×85 points. X=10, Y=78 là vị trí góc dưới-trái.",
          ],
        },
      ].map((s, i) => (
        <div className="scenario" key={i}>
          <div className="scenario-head">{s.title}</div>
          <div className="scenario-body">
            <p>{s.desc}</p>
            <ul>{s.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
          </div>
        </div>
      ))}
      <div className="callout info">
        <span className="callout-icon">ℹ</span>
        <div className="callout-body">Quy đổi: <strong>1mm ≈ 2.84 points</strong>. Label 40×30mm = 113×85 points.</div>
      </div>

      <h2 id="s4">4. Sơ đồ luồng xử lý</h2>
      <table>
        <thead><tr><th>Bước</th><th>Mô tả</th></tr></thead>
        <tbody>
          <tr><td><strong>Upload PDF</strong></td><td>Tool tự đọc và nhận diện FNSKU từng trang (tối đa 50MB)</td></tr>
          <tr><td><strong>Có FNSKU?</strong></td><td>Trang không có FNSKU sẽ được đặt tên <code>unknown_N</code></td></tr>
          <tr><td><strong>FNSKU trùng?</strong></td><td>Tự động thêm hậu tố <code>_v2</code>, <code>_v3</code>... cho tên file</td></tr>
          <tr><td><strong>Thêm text?</strong></td><td>Nếu toggle bật: chèn text tại tọa độ X, Y (đơn vị: points)</td></tr>
          <tr><td><strong>Convert PNG</strong></td><td>Xuất ảnh 300 DPI</td></tr>
          <tr><td><strong>Đóng gói</strong></td><td>Tất cả ảnh đóng gói thành <code>fba_labels.zip</code> và tải về tự động</td></tr>
        </tbody>
      </table>

      <h2 id="s5">5. Xử lý sự cố thường gặp</h2>
      <table>
        <thead><tr><th>Lỗi / Tình huống</th><th>Cách xử lý</th></tr></thead>
        <tbody>
          {[
            ["File không upload được", "Kiểm tra định dạng (.pdf) và kích thước (tối đa 50MB)"],
            ["Trang PDF không tìm thấy FNSKU", "FNSKU trên trang đó không theo định dạng B0/X0 + 8 ký tự. Kiểm tra lại file PDF gốc"],
            ["Text bị lệch vị trí", "Điều chỉnh tọa độ X (trái/phải) và Y (tính từ trên xuống, đơn vị: points). Label 40×30mm = 113×85pt"],
            ["Xử lý dừng giữa chừng", "Server timeout sau 5 phút. Thử với file PDF ít trang hơn hoặc liên hệ hỗ trợ"],
            ["Nút Tải lại không hoạt động", "ZIP chỉ lưu trong phiên hiện tại. Nếu tải lại trang, cần xử lý lại file PDF"],
            ["Log hiện [WARN] Malformed chunk", "Thường là do kết nối mạng không ổn định. Thử lại hoặc dùng kết nối tốt hơn"],
          ].map(([err, fix], i) => (
            <tr key={i}>
              <td><code>{err}</code></td>
              <td>{fix}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="callout warn">
        <span className="callout-icon">⚠</span>
        <div className="callout-body">
          <strong>Lưu ý bảo mật:</strong> File PDF và ảnh PNG được xử lý trên server nhưng
          không được lưu lại sau khi hoàn thành. Mỗi lần truy cập là một phiên độc lập.
        </div>
      </div>

      <div className="doc-footer">
        Developed by Stephen 10K3D using AI &middot; FBA Label Tool v4
      </div>
    </>
  );
}
