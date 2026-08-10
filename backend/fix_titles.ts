import { sequelize } from './src/config/database';
import { Event } from './src/models/Event';

async function fixTitles() {
  try {
    await sequelize.authenticate();
    console.log('Connected.');
    
    await Event.update({
      title: "Bùi Công Nam — \"THE STORY\" Live Tour in Hà Nội 2026",
      short_description: "Bùi Công Nam mang \"THE STORY\" Live Tour đến Hà Nội — đêm nhạc acoustic đầy cảm xúc tại Cung Xuân",
    }, { where: { id: 2 } });
    
    await Event.update({
      title: "Đại Tiệc Nhạc Nước Mừng Quốc Tế Thiếu Nhi tại Van Phuc City",
      short_description: "Show nhạc nước đẳng cấp quốc tế mừng ngày Quốc tế Thiếu nhi tại quảng trường nhạc nước lớn nhất Việt Nam",
    }, { where: { id: 6 } });
    
    await Event.update({
      title: "The Dome Show #4: Mini Show Quang Hà — Ngỡ Như Trăm Năm",
      short_description: "Đêm nhạc lãng mạn cùng Quang Hà trong không gian lâu đài cổ kính tại Đà Lạt",
    }, { where: { id: 5 } });
    
    await Event.update({
      title: "Những Thành Phố Mơ Màng — Summer Concert 2026",
      short_description: "Lễ hội âm nhạc indie hoành tráng nhất mùa hè với sự góp mặt của Ngọt, Chillies, Vũ, Vũ Thanh Vân",
    }, { where: { id: 7 } });
    
    await Event.update({
      title: "HBAShow: Nồng Nàn Hà Nội — Bạch Công Khanh",
      short_description: "Đêm nhạc kết hợp đầu tiên của Ngọc Anh & Bạch Công Khanh — Nồng Nàn Hà Nội tại SOL 8 Live Stage",
    }, { where: { id: 1 } });
    
    console.log('Updated all event titles successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixTitles();
