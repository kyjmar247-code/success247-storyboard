import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Quote, School, Hash, ArrowRight, Calendar } from 'lucide-react';
import reviewsData from './data/reviews.json';


// 숫자 애니메이션 훅
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(ease * end));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };
    
    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

// 이름 마스킹 처리 (홍길동 -> 홍O동)
const maskName = (name) => {
  if (!name) return '';
  if (name.length <= 2) return name.charAt(0) + 'O';
  return name.charAt(0) + 'O'.repeat(name.length - 2) + name.charAt(name.length - 1);
};

// 포스트잇 스타일 헬퍼 (색상, 회전각도)
const getPostitStyle = (id) => {
  const colors = [
    'bg-[#fef3c7] text-slate-800', // Yellow (amber-100)
    'bg-[#e0f2fe] text-slate-800', // Blue (sky-100)
    'bg-[#fce7f3] text-slate-800', // Pink (fuchsia-100)
    'bg-[#dcfce7] text-slate-800', // Green (green-100)
  ];
  
  // 고유 ID 기반으로 일정하게 색상과 각도 부여
  const num = parseInt(id.toString().replace(/[^0-9]/g, '') || '0') + (id.toString().charCodeAt(0) || 0);
  const color = colors[num % colors.length];
  
  const rotations = ['-rotate-2', '-rotate-1', 'rotate-1', 'rotate-2', 'rotate-3', '-rotate-3'];
  const rotation = rotations[num % rotations.length];

  return { color, rotation };
};

export default function App() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [query, setQuery] = useState('');
  const data = reviewsData;
  const totalReviewsCount = useCounter(data.length, 2500);

  // 평가 항목 17가지를 직관적으로 그룹화한 핵심 키워드 리스트
  const availableTags = [
    '학습 관리', '입시 관리', '학습 계획', '플래너 관리', 
    '질의응답', '인강 추천', '생활 관리', '면학 분위기', 
    '졸음 관리', '방화벽', '모의고사', '이투스 구독'
  ];

  // 태그 선택 토글 (단일 선택)
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? [] : [tag]
    );
  };

  // 필터링 로직
  const filteredReviews = useMemo(() => {
    return data.map((review) => {
      // 만족도 50% 이하 리뷰는 성공 스토리에 어울리지 않으므로 아예 노출 제외
      if (review.satisfaction <= 50) return null;

      const q = query.trim().toLowerCase();
      // '지점', '점', '학원', '이투스247' 등 검색 시 흔히 붙는 접미사 제거하여 정확도 상향
      const normalizedQ = q.replace(/(지점|점|학원|이투스247|기숙)\s*$/g, '').trim() || q;
      
      // 검색어가 빈 문자열이면 통과
      let matchQuery = false;
      if (q === '') {
        matchQuery = true;
      } else if (normalizedQ === '대치') {
        // "대치" 검색 시 오직 "강남" 지점의 리뷰만 노출
        matchQuery = review.branch === '강남';
      } else {
        // 사용자의 요청에 따라 본문(글 내용)은 무시하고 오직 지점명(branch)만으로 검색
        matchQuery = Boolean(review.branch && review.branch.toLowerCase().includes(normalizedQ));
      }

      // 태그 필터 (오직 J열 요약문구만 기반으로 매칭)
      let matchTags = true;
      if (selectedTags.length > 0) {
        matchTags = selectedTags.some(tag => {
          const text = (Array.isArray(review.summaryQuote) ? review.summaryQuote.join(' ') : review.summaryQuote).toLowerCase();
          const keyword = tag.replace(/\s+/g, '').toLowerCase();
          const rawText = text.replace(/\s+/g, '');
          
          if (rawText.includes(keyword)) return true;
          
          if (keyword === '생활관리' && (rawText.includes('생활상담') || rawText.includes('전자출결') || rawText.includes('핸드폰수거'))) {
            return true;
          }
          if (keyword === '학습계획' && rawText.includes('매리트')) {
            return true;
          }
          if (keyword === '학습관리' && rawText.includes('학습상담')) {
            return true;
          }
          if (keyword === '입시관리' && rawText.includes('입시상담')) {
            return true;
          }
          
          return false;
        });
      }

      return { ...review, _matchTags: matchTags, _matchQuery: matchQuery };
    }).filter(r => r !== null && r._matchTags && r._matchQuery);
  }, [selectedTags, query, data]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 selection:bg-etoos-blue selection:text-white">
      
      {/* Hero Section (아날로그 메모장 테마) */}
      <section className="relative overflow-hidden px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28 bg-[#fdfdfc]">
        {/* 모눈종이 패턴 배경 */}
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto max-w-4xl"
        >
          {/* 중앙 대형 메모장 패널 */}
          <div className="relative mx-auto max-w-3xl bg-white p-10 sm:p-14 shadow-lg rounded-sm transform rotate-1">
            {/* 상단 마스킹 테이프 장식 */}
            <div className="absolute -top-4 left-1/2 h-8 w-32 -translate-x-1/2 -rotate-3 bg-white/60 backdrop-blur-sm shadow-sm opacity-90" style={{ clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)' }}></div>
            
            <span className="inline-block transform -rotate-2 bg-[#fef3c7] px-4 py-1.5 text-sm font-bold tracking-wide text-amber-800 shadow-sm mb-8">
              #2026학년도 #재원생_리얼후기 #총_{totalReviewsCount}개의_기록
            </span>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-800 sm:text-5xl lg:text-6xl text-balance leading-[1.3]">
              나의 247 라이프
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 sm:text-xl text-balance mt-6 leading-relaxed">
              치열했던 고민의 시간부터 마침내 목표를 이룬 빛나는 순간까지,<br className="hidden sm:block" />
              <span className="relative inline-block mt-2 font-medium text-slate-800">
                선배들이 직접 기록한 생생한 학원 생활 다이어리를 펼쳐보세요.
                <span className="absolute bottom-1 left-0 -z-10 h-3 w-full bg-[#e0f2fe] opacity-70 rounded-full"></span>
              </span>
            </p>
            
            {/* 메인 1단 내 상담 예약 CTA 버튼 */}
            <div className="mt-8">
              <a 
                href="#consultation" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('consultation-cta')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#16224f] px-8 py-3.5 text-sm font-extrabold text-white transition-all hover:bg-black hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer"
              >
                지금 상담 예약하기
                <ArrowRight className="h-4 w-4 text-[#fef3c7]" />
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. Interactive Tag Cloud & Search */}
      <section className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          
          {/* 태그 클라우드 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-5 h-5 text-etoos-blue" />
              <span className="text-sm font-bold text-slate-700">핵심 키워드 탐색</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                    selectedTags.includes(tag)
                      ? 'bg-etoos-blue text-white shadow-md scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* 검색창 */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="지점명, 키워드 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border-none bg-slate-100 pl-12 pr-4 text-sm focus:ring-2 focus:ring-etoos-blue transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Masonry Grid Cards */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        
        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-32 text-center border border-slate-200 shadow-sm">
            <Search className="mb-6 h-16 w-16 text-slate-200" />
            <p className="text-xl font-bold text-slate-400">조건에 맞는 성장 스토리가 없어요.</p>
          </div>
        ) : (
          /* CSS Multi-column layout for Masonry effect */
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-8 pb-12 pt-6">
            {filteredReviews.map((review) => {
              const { color, rotation } = getPostitStyle(review.id);
              return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                key={review.id}
                className={`relative break-inside-avoid p-7 text-left shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:z-10 hover:scale-105 ${color} ${rotation} rounded-sm`}
              >
                {/* 반투명 마스킹 테이프 장식 */}
                <div className="absolute -top-3 left-1/2 h-7 w-20 -translate-x-1/2 -rotate-2 bg-white/60 backdrop-blur-sm shadow-sm opacity-80" style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}></div>

                {/* 상단 뱃지 */}
                <div className="mb-5 flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-block rounded bg-white/60 px-2.5 py-1 text-xs font-bold text-etoos-blue shadow-sm">
                    만족도 {review.satisfaction}%
                  </span>
                  {review.studentType && (
                    <span className="inline-block rounded bg-white/50 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      {review.studentType}
                    </span>
                  )}
                </div>

                {/* 인용구 (자연스러운 줄바꿈) - 사용자가 수정한 J열 내용 (고정) */}
                <h3 className="mb-4 text-[1.05rem] font-medium leading-loose text-slate-800 break-keep text-balance">
                  <span className="text-etoos-blue mr-1 font-serif text-xl">"</span>
                  {Array.isArray(review.summaryQuote) ? review.summaryQuote.join(' ') : review.summaryQuote}
                  <span className="text-etoos-blue ml-1 font-serif text-xl">"</span>
                </h3>
                
                {/* 하단 작성자 정보 영역 (이름, 지점 등) */}
                <div className="flex items-center justify-between border-t border-black/5 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-slate-500 shadow-sm">
                      <School className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{maskName(review.name)}</p>
                      <p className="text-xs text-slate-600">{review.branch}</p>
                    </div>
                  </div>
                  <Quote className="h-6 w-6 text-black/10" />
                </div>
              </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* 하단 CTA 영역 */}
      <section id="consultation-cta" className="bg-[#16224f] py-20 sm:py-28 text-center px-4 relative overflow-hidden">
        {/* 모눈종이 데코레이션 배경 */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative mx-auto max-w-3xl z-10">
          <h2 className="mb-10 text-3xl font-bold leading-[1.4] text-white sm:text-4xl text-balance">
            선배들의 <span className="text-[#fef3c7] underline decoration-wavy decoration-amber-400">247 라이프</span>,<br className="hidden sm:block" />
            이제 당신의 이야기가 됩니다.
          </h2>
          <button className="inline-flex items-center justify-center rounded-full bg-[#fef3c7] hover:bg-[#fde68a] px-10 py-5 text-[1.1rem] font-extrabold text-[#16224f] transition-all hover:-translate-y-1 hover:shadow-xl shadow-lg w-full sm:w-auto transform active:scale-95">
            지금 상담 예약하기
          </button>
        </div>
      </section>

      {/* 우측 하단 플로팅 상담 예약 CTA 버튼 */}
      <FloatingCTA />
    </div>
  );
}

// 스크롤 감지 플로팅 버튼 컴포넌트
function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 헤더 영역(약 500px) 아래로 내려가면 버튼 노출
      if (window.scrollY > 400) {
        // 하단 푸터/CTA 영역에 다다르면 플로팅 버튼 숨기기
        const ctaSection = document.getElementById('consultation-cta');
        if (ctaSection) {
          const rect = ctaSection.getBoundingClientRect();
          const isNearBottom = rect.top < window.innerHeight - 50;
          setVisible(!isNearBottom);
        } else {
          setVisible(true);
        }
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    document.getElementById('consultation-cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#fef3c7] border border-amber-200/50 px-5 py-3.5 shadow-2xl hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.15)] text-slate-800 transition-all font-bold text-sm"
        >
          <Calendar className="h-4 w-4 text-[#16224f]" />
          <span>상담 예약</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
