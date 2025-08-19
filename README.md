# Solana Bonding Curve Dapp - Ứng dụng DeFi với Bonding Curve

Ứng dụng phi tập trung (Dapp) DeFi với bonding curve, kết nối với ví Phantom trên mạng Solana Devnet, được xây dựng với Next.js, Solana Web3.js, Anchor và shadcn/ui.

## 🚀 Tính năng chính

### 🔐 Kết nối ví
- ✅ Kết nối ví Phantom
- ✅ Hiển thị thông tin ví (địa chỉ, số dư)
- ✅ Hỗ trợ mạng Solana Devnet

### 📈 Bonding Curve
- ✅ **Khởi tạo Pool**: Tạo pool mới với tham số tùy chỉnh
- ✅ **Mua Token**: Mua token bằng SOL theo bonding curve
- ✅ **Bán Token**: Bán token để nhận SOL theo bonding curve
- ✅ **Tính toán giá**: Giá tự động điều chỉnh theo cung cầu

### 📊 Giao diện
- ✅ **Biểu đồ tương tác**: Sử dụng Lightweight Charts
- ✅ **Giao diện đẹp mắt**: shadcn/ui với thiết kế hiện đại
- ✅ **Responsive design**: Hoạt động tốt trên mọi thiết bị
- ✅ **Tab navigation**: Chuyển đổi giữa các chức năng

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 3, shadcn/ui
- **Blockchain**: Solana Web3.js, Solana Wallet Adapter, Anchor Framework
- **Wallet**: Phantom Wallet
- **Charts**: Lightweight Charts
- **Icons**: Lucide React

## 📋 Yêu cầu hệ thống

- Node.js 18+ 
- npm hoặc yarn
- Ví Phantom (cài đặt từ [phantom.app](https://phantom.app/))
- Solana Program ID (sau khi deploy smart contract)

## 🚀 Cài đặt và chạy

### 1. Clone dự án
```bash
git clone <repository-url>
cd bonding-curve
```

### 2. Cài đặt dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Cấu hình môi trường
Tạo file `.env.local` với nội dung:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_BONDING_CURVE_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
```

### 4. Chạy dự án
```bash
npm run dev
```

Dự án sẽ chạy tại [http://localhost:3000](http://localhost:3000)

## 🔗 Kết nối ví

1. **Cài đặt ví Phantom**: Tải và cài đặt ví Phantom từ [phantom.app](https://phantom.app/)
2. **Chuyển sang Devnet**: Trong ví Phantom, chuyển sang mạng Solana Devnet
3. **Kết nối**: Nhấn nút "Connect Wallet" trong Dapp
4. **Phê duyệt**: Phê duyệt kết nối trong ví Phantom

## 💰 Lấy SOL Devnet

Để test các tính năng, bạn cần SOL trên mạng Devnet:

1. Kết nối ví Phantom với Dapp
2. Nhấn nút "Faucet" để mở Solana Faucet
3. Nhập địa chỉ ví của bạn
4. Nhận SOL Devnet miễn phí

## 🎯 Sử dụng Bonding Curve

### Khởi tạo Pool
1. Chuyển đến tab "Quản lý Pool"
2. Nhập tham số: Tổng cung, Virtual SOL Reserve, Virtual Token Reserve
3. Nhấn "Khởi tạo Pool"

### Mua Token
1. Chuyển đến tab "Giao dịch"
2. Chọn "Mua"
3. Nhập số lượng SOL muốn sử dụng
4. Xem số token sẽ nhận được
5. Nhấn "Mua Token"

### Bán Token
1. Chuyển đến tab "Giao dịch"
2. Chọn "Bán"
3. Nhập số lượng token muốn bán
4. Xem số SOL sẽ nhận được
5. Nhấn "Bán Token"

### Xem Biểu đồ
1. Chuyển đến tab "Biểu đồ"
2. Xem bonding curve và vị trí hiện tại
3. Theo dõi thay đổi giá theo thời gian thực

## 🔧 Cấu trúc dự án

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # CSS toàn cục với biến shadcn/ui
│   ├── layout.tsx         # Layout chính với WalletProvider
│   └── page.tsx           # Trang chính
├── components/             # React components
│   ├── ui/                # Components shadcn/ui
│   │   ├── button.tsx     # Component Button
│   │   └── card.tsx       # Component Card
│   ├── WalletProvider.tsx # Provider quản lý ví Solana
│   ├── WalletConnect.tsx  # Component kết nối ví
│   ├── DemoFeatures.tsx   # Component demo các tính năng
│   ├── BondingCurveChart.tsx # Component biểu đồ bonding curve
│   ├── TradingPanel.tsx   # Component giao dịch mua/bán
│   ├── InitializePool.tsx # Component khởi tạo pool
│   └── Dapp.tsx           # Component chính của Dapp
├── services/               # Business logic services
│   └── bondingCurve.ts    # Service tương tác với smart contract
├── config/                 # Cấu hình
│   ├── solana.ts          # Cấu hình Solana
│   └── env.ts             # Cấu hình môi trường
├── idl/                    # Anchor IDL
│   └── bonding-curve.json # Interface Definition Language
└── lib/                    # Utility functions
    └── utils.ts            # Utility functions cho shadcn/ui
```

## 🌐 Mạng

- **Network**: Solana Devnet
- **RPC Endpoint**: Tự động từ `clusterApiUrl(WalletAdapterNetwork.Devnet)`
- **Explorer**: [Solana Devnet Explorer](https://explorer.solana.com/?cluster=devnet)
- **Smart Contract**: Sử dụng Anchor Framework

## 📱 Responsive Design

Dapp được thiết kế responsive với:
- Mobile-first approach
- Grid layout linh hoạt
- Breakpoints: sm, md, lg, xl
- Touch-friendly buttons và interactions

## 🚨 Lưu ý quan trọng

- **Devnet**: Chỉ sử dụng cho mục đích test, không có giá trị thực
- **Bảo mật**: Không chia sẻ private key hoặc seed phrase
- **Phantom**: Đảm bảo cài đặt ví Phantom chính thức
- **Program ID**: Cần cập nhật Program ID thực tế sau khi deploy smart contract

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork dự án
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

Dự án này được phát hành dưới MIT License.

## 🔗 Liên kết hữu ích

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Phantom Wallet](https://phantom.app/)
- [Solana Faucet](https://solfaucet.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Next.js](https://nextjs.org/)
- [Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
