import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { STORE_ASSETS } from '../../assets/images';

export const MainBrandsBanner: React.FC = () => {
  // Subcategories for FORZA (Ordered Left-to-Right matching reference image)
  const forzaCategories = [
    {
      id: 'belts',
      title: 'تسمه‌ها',
      image: STORE_ASSETS.forzaSubBelt || STORE_ASSETS.products.forzaBelt,
      link: '/category/industrial-belts',
    },
    {
      id: 'bearings',
      title: 'بلبرینگ‌ها',
      image: STORE_ASSETS.forzaSubBearing || STORE_ASSETS.products.bearing,
      link: '/category/power-transmission',
    },
    {
      id: 'couplings',
      title: 'کوپلینگ‌ها',
      image: STORE_ASSETS.forzaSubCoupling || STORE_ASSETS.categories.transmission,
      link: '/category/power-transmission',
    },
    {
      id: 'fittings',
      title: 'اتصالات صنعتی',
      image: STORE_ASSETS.forzaSubFittings || STORE_ASSETS.products.ceramicParts,
      link: '/category/production-fittings',
    },
  ];

  // Subcategories for SWR (Ordered Left-to-Right matching reference image)
  const swrCategories = [
    {
      id: 'valves',
      title: 'شیرآلات',
      image: STORE_ASSETS.swrSubValve || STORE_ASSETS.products.valve,
      link: '/category/industrial-valves',
    },
    {
      id: 'elbows',
      title: 'اتصالات',
      image: STORE_ASSETS.swrSubElbow || STORE_ASSETS.products.ceramicParts,
      link: '/category/production-fittings',
    },
    {
      id: 'pipes',
      title: 'لوله‌ها',
      image: STORE_ASSETS.swrSubPipes || STORE_ASSETS.products.pipes,
      link: '/category/pipes-flanges',
    },
    {
      id: 'flanges',
      title: 'فلنج‌ها',
      image: STORE_ASSETS.swrSubFlanges || STORE_ASSETS.products.flange,
      link: '/category/pipes-flanges',
    },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[#414146] text-white border-y border-[#55565A]/80 shadow-2xl py-10 sm:py-14 lg:py-16 select-none">
      {/* Full-Bleed Dual Machinery Background (Left: Orange FORZA Belt, Right: Blue SWR Valve) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={STORE_ASSETS.brandsFullbleedBg || STORE_ASSETS.forzaSwrDualBanner}
          alt="برندهای معتبر جهانی FORZA و SWR"
          className="w-full h-full object-cover object-center opacity-80"
        />
        {/* Smooth Center Vignette so Center Text & Cards Pop Cleanly while Left & Right Machinery Remain Vivid */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(65,65,70,0.2) 0%, rgba(65,65,70,0.82) 22%, rgba(65,65,70,0.96) 38%, rgba(65,65,70,0.96) 62%, rgba(65,65,70,0.82) 78%, rgba(65,65,70,0.2) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#414146] via-transparent to-[#414146]/90" />

        {/* Coordinated Industrial Dot Pattern matching the industries section */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff18_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none" />

        {/* Ambient Left Orange & Right Blue Glows */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[12%] w-80 h-80 bg-[#E06518]/22 rounded-full blur-[110px]" />
        <div className="absolute top-1/2 -translate-y-1/2 right-[12%] w-80 h-80 bg-[#0077FF]/22 rounded-full blur-[110px]" />
      </div>

      {/* Bottom Glowing Orange Laser Horizon Line */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#E06518] to-transparent shadow-[0_0_20px_#E06518] pointer-events-none z-20" />
      <div className="absolute bottom-0 left-1/4 right-1/4 h-6 bg-gradient-to-t from-[#E06518]/25 to-transparent blur-md pointer-events-none z-10" />

      {/* Main Content Container (Centered between Left & Right Edge Machinery) */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-8 lg:px-6 space-y-8 sm:space-y-10">
        {/* Top Centered Header Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto" dir="rtl">
          <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-black text-white tracking-tight leading-tight drop-shadow-md">
            برندهای معتبر جهانی،{' '}
            <span className="text-[#F97316] bg-gradient-to-l from-[#FF8C00] to-[#E06518] bg-clip-text text-transparent">
              در کنار شما
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300/95 leading-relaxed font-normal max-w-xl mx-auto">
            پیش به صنعت با همکاری برندهای مطرح جهانی، تأمین‌کننده قطعات و تجهیزات صنعتی با کیفیت،
            <br className="hidden sm:inline" /> معتبر و با اصالت برای صنایع مختلف کشور است.
          </p>
        </div>

        {/* Dual Brand Split Grid: Left = FORZA, Right = SWR (Matching Reference Image Layout) */}
        <div
          className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-stretch pt-2"
          dir="ltr"
        >
          {/* Center Vertical Divider Line */}
          <div className="hidden lg:block absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-slate-600/45 to-transparent pointer-events-none" />

          {/* ================================================================= */}
          {/* LEFT COLUMN: FORZA (Orange Industrial Accent)                     */}
          {/* ================================================================= */}
          <div className="flex flex-col items-center justify-between space-y-6">
            <div className="flex flex-col items-center space-y-4 w-full max-w-md">
              {/* FORZA Logo Lockup */}
              <div className="flex items-center justify-center gap-3.5">
                {/* Stylized Geometric Orange FORZA Emblem */}
                <svg
                  className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 drop-shadow-[0_0_12px_rgba(249,115,22,0.35)]"
                  viewBox="0 0 64 64"
                  fill="none"
                >
                  <path
                    d="M14 14L44 6L38 22L22 26L18 46L8 52L14 14Z"
                    fill="url(#forzaGrad1)"
                  />
                  <path
                    d="M26 30L54 22L48 38L30 43L22 58L18 46L26 30Z"
                    fill="url(#forzaGrad2)"
                  />
                  <defs>
                    <linearGradient id="forzaGrad1" x1="8" y1="6" x2="44" y2="52" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF9E2C" />
                      <stop offset="1" stopColor="#E05A00" />
                    </linearGradient>
                    <linearGradient id="forzaGrad2" x1="18" y1="22" x2="54" y2="58" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF7A00" />
                      <stop offset="1" stopColor="#C94A00" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="text-left">
                  <div className="flex items-start leading-none">
                    <span className="text-3xl sm:text-[42px] font-black tracking-wider text-white font-sans">
                      FORZA
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold ml-1 mt-1">®</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] tracking-[0.28em] text-[#F97316] font-bold uppercase mt-1">
                    POWER YOUR INDUSTRY
                  </div>
                </div>
              </div>

              {/* FORZA Description (RTL Persian) */}
              <p
                dir="rtl"
                className="text-xs sm:text-[13px] text-slate-200/95 leading-7 text-center sm:text-right w-full max-w-[360px] font-normal"
              >
                <strong className="font-bold text-white">فورزا (FORZA)</strong> یکی از برندهای نام‌آشنای جهانی در تولید و تأمین قطعات صنعتی، اتصالات و تجهیزات با کیفیت بالا برای صنایع مختلف است.
              </p>

              {/* FORZA Pill Button */}
              <div className="pt-1 w-full flex justify-center sm:justify-end max-w-[360px]">
                <Link
                  to="/category/swr-forza-exclusive"
                  className="inline-flex items-center justify-between gap-5 px-6 py-2.5 rounded-full bg-[#0B101B]/80 hover:bg-[#E06518] border border-[#E06518]/80 hover:border-[#E06518] text-[#F97316] hover:text-white text-xs sm:text-[13px] font-bold transition-all duration-300 shadow-[0_0_18px_rgba(224,101,24,0.18)] hover:shadow-[0_0_24px_rgba(224,101,24,0.5)] cursor-pointer group/btn"
                >
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  <span dir="rtl">مشاهده محصولات فورزا</span>
                </Link>
              </div>
            </div>

            {/* FORZA 4 Subcategory Cards */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 w-full max-w-[430px] pt-2">
              {forzaCategories.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="bg-[#0D1524]/90 hover:bg-[#131F33] border border-slate-700/60 hover:border-[#E06518] rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-between text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(224,101,24,0.28)] cursor-pointer group/card aspect-[1/1.18]"
                >
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-lg p-1">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain group-hover/card:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span
                    dir="rtl"
                    className="text-[10px] sm:text-[11px] font-bold text-slate-200 group-hover/card:text-[#F97316] transition-colors pt-1.5 truncate w-full"
                  >
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: SWR (Blue Industrial Accent)                        */}
          {/* ================================================================= */}
          <div className="flex flex-col items-center justify-between space-y-6">
            <div className="flex flex-col items-center space-y-4 w-full max-w-md">
              {/* SWR Logo Lockup */}
              <div className="flex items-center justify-center gap-3.5">
                {/* Stylized Two-Tone Blue & White SWR Emblem */}
                <svg
                  className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 drop-shadow-[0_0_12px_rgba(0,136,255,0.35)]"
                  viewBox="0 0 64 64"
                  fill="none"
                >
                  <path
                    d="M32 6L10 30L22 42L36 26L28 18L36 10L32 6Z"
                    fill="#0088FF"
                  />
                  <path
                    d="M32 58L54 34L42 22L28 38L36 46L28 54L32 58Z"
                    fill="#F8FAFC"
                  />
                </svg>

                <div className="text-left">
                  <div className="flex items-start leading-none">
                    <span className="text-3xl sm:text-[42px] font-black tracking-wider text-white font-sans">
                      SWR
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold ml-1 mt-1">®</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] tracking-[0.24em] text-[#0088FF] font-bold uppercase mt-1">
                    INDUSTRIAL SOLUTIONS
                  </div>
                </div>
              </div>

              {/* SWR Description (RTL Persian) */}
              <p
                dir="rtl"
                className="text-xs sm:text-[13px] text-slate-200/95 leading-7 text-center sm:text-right w-full max-w-[360px] font-normal"
              >
                <strong className="font-bold text-white">SWR</strong> با ارائه محصولات با کیفیت و فناوری روز دنیا، در زمینه اتصالات، شیرآلات و تجهیزات صنعتی، انتخابی مطمئن برای صنایع مختلف است.
              </p>

              {/* SWR Pill Button */}
              <div className="pt-1 w-full flex justify-center sm:justify-end max-w-[360px]">
                <Link
                  to="/category/swr-forza-exclusive"
                  className="inline-flex items-center justify-between gap-5 px-6 py-2.5 rounded-full bg-[#0B101B]/80 hover:bg-[#0077FF] border border-[#0077FF]/80 hover:border-[#0077FF] text-[#38BDF8] hover:text-white text-xs sm:text-[13px] font-bold transition-all duration-300 shadow-[0_0_18px_rgba(0,136,255,0.18)] hover:shadow-[0_0_24px_rgba(0,136,255,0.5)] cursor-pointer group/btn"
                >
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  <span dir="rtl">مشاهده محصولات SWR</span>
                </Link>
              </div>
            </div>

            {/* SWR 4 Subcategory Cards */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 w-full max-w-[430px] pt-2">
              {swrCategories.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="bg-[#0D1524]/90 hover:bg-[#131F33] border border-slate-700/60 hover:border-[#0088FF] rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-between text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,136,255,0.28)] cursor-pointer group/card aspect-[1/1.18]"
                >
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-lg p-1">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain group-hover/card:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span
                    dir="rtl"
                    className="text-[10px] sm:text-[11px] font-bold text-slate-200 group-hover/card:text-[#38BDF8] transition-colors pt-1.5 truncate w-full"
                  >
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
