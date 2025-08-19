# 🚀 Hướng dẫn cài đặt nhanh

## ⚠️ Lưu ý quan trọng

Dự án này sử dụng React 19 và có thể gặp một số vấn đề tương thích với một số packages. Chúng ta sẽ sử dụng `--legacy-peer-deps` để giải quyết.

## 📋 Bước 1: Cài đặt dependencies

```bash
npm install --legacy-peer-deps
```

**Hoặc** nếu vẫn gặp lỗi:

```bash
npm install --force
```

## 📋 Bước 2: Chạy dự án

```bash
npm run dev
```

## 📋 Bước 3: Mở trình duyệt

Truy cập [http://localhost:3000](http://localhost:3000)

## 📋 Bước 4: Cài đặt ví Phantom

1. Tải ví Phantom từ [phantom.app](https://phantom.app/)
2. Cài đặt extension cho trình duyệt
3. Tạo ví mới hoặc import ví cũ

## 📋 Bước 5: Chuyển sang Devnet

1. Mở ví Phantom
2. Nhấn vào icon cài đặt (⚙️)
3. Chọn "Change Network"
4. Chọn "Devnet"

## 📋 Bước 6: Kết nối với Dapp

1. Nhấn "Connect Wallet" trong Dapp
2. Phê duyệt kết nối trong ví Phantom
3. Hoàn tất! 🎉

## 💰 Lấy SOL Devnet

Nhấn nút "Faucet" để nhận SOL miễn phí trên Devnet.

## 🆘 Xử lý lỗi

### Lỗi dependencies:
```bash
# Giải pháp 1: Sử dụng legacy peer deps
npm install --legacy-peer-deps

# Giải pháp 2: Sử dụng force
npm install --force

# Giải pháp 3: Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Lỗi khác:
- Node.js version (cần 18+)
- Ví Phantom đã cài đặt
- Đã chuyển sang Devnet
- Console browser có lỗi gì không

## 📞 Hỗ trợ

Nếu cần hỗ trợ, hãy tạo issue trên GitHub.
