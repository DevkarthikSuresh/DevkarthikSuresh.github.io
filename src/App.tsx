import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

/* ───────── Icons ───────── */
const Arrow = ({ diagonal = false }: { diagonal?: boolean }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    {diagonal ? <path d="M7 17 17 7M8 7h9v9" /> : <path d="M5 12h14m-5-5 5 5-5 5" />}
  </svg>
);

/* ───────── Content (from CV) ───────── */
const experiences = [
  {
    period: "Mar 2026 — Present",
    place: "London / Hybrid",
    organization: "University College London",
    position: "Visiting Researcher · Soft Robotics",
    description:
      "Researching how a soft robotic arm can understand its own 3D shape without relying on a camera during operation.",
    work: [
      "Built a PointNet autoencoder that compresses a 1,024-point representation of the arm into just 64 values.",
      "Trained a second model to infer that compressed 3D shape directly from six motor readings.",
      "Calibrated Intel RealSense cameras, collected training data, and handled the arm’s electronics.",
    ],
    takeaway:
      "The system reconstructed the arm’s shape from motor data alone, staying within 6% of the camera-based model’s error on 1,000 unseen samples.",
  },
  {
    period: "Dec 2025",
    place: "Thiruvananthapuram",
    organization: "ISRO — VSSC",
    position: "Research Intern · Robotics",
    description:
      "Improved the perception and control stack of a prototype based on the robotic manipulator flown on the POEM mission.",
    work: [
      "Replaced printed AprilTags with markerless depth sensing so the arm could track objects without visual markers.",
      "Connected a ROS 2 RealSense perception pipeline to the arm’s existing ROS 1 control system on NVIDIA Jetson.",
      "Derived a closed-form inverse-kinematics solver and modelled joint torques in MATLAB Simscape.",
    ],
    takeaway:
      "The custom solver calculated arm positions four times faster than the standard ROS KDL solver, with tested position error below 0.0016 mm.",
  },
  {
    period: "Dec 2026",
    place: "Bangalore",
    organization: "Indian Institute of Science",
    position: "Incoming Research Assistant · IACV Lab",
    description: "Joining Dr. Soma Biswas’s lab to study continual learning in 3D vision.",
    work: [],
    takeaway:
      "The research will focus on helping visual systems learn new information without forgetting knowledge they already acquired.",
  },
];

const projects = [
  {
    index: "01",
    title: "MobileGS Rover",
    field: "Autonomous mapping · 3D vision",
    intro:
      "A compact indoor rover that captures a space, reconstructs it in 3D, and recognizes where it is when returning later.",
    problem:
      "Detailed 3D mapping usually depends on powerful desktop hardware or cloud processing. That makes robots slower, less private, and dependent on a network.",
    solution:
      "COLMAP, 3D Gaussian Splatting, ORB feature matching, and PnP-RANSAC on an NVIDIA Jetson. The whole pipeline runs at the edge.",
    outcome:
      "Map memory cut by roughly 60%, with position recovered to within 4.5 cm and orientation to within 2.1°.",
    visual: "map",
    theme: "case-violet",
  },
  {
    index: "02",
    title: "Vision-Based Collision Avoidance",
    field: "Embedded AI · Safety",
    intro:
      "A low-cost system that watches moving objects and predicts collision risk from a single ordinary camera.",
    problem:
      "Small robots often cannot afford depth cameras, LiDAR, or large computers, but they still need to move safely around people and objects.",
    solution:
      "A Raspberry Pi 4 pipeline using YOLO for detection, SORT for tracking, and a two-stage Kalman filter for motion prediction.",
    outcome: "Live at 12–15 FPS with 91.3% detection precision and 82.1% MOTA on inexpensive hardware.",
    visual: "track",
    theme: "case-coral",
  },
  {
    index: "03",
    title: "APIS Rover Swarm",
    field: "Multi-robot systems · Research",
    intro:
      "A decentralized coordination system for rover teams exploring environments where communication is unreliable.",
    problem:
      "A planetary rover swarm cannot depend on one permanent leader. If that rover fails, the team must still coordinate and avoid collisions.",
    solution:
      "RAFT-inspired automatic leader election paired with a finite-state collision-avoidance system, simulated in Webots.",
    outcome: "A new leader chosen in 4.2 s on average, while keeping at least 1.98 m between rovers.",
    visual: "swarm",
    theme: "case-mint",
  },
];

/* ───────── Hooks & helpers ───────── */
function Count({ to, decimals = 0, prefix = "" }: { to: number; decimals?: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setVal(to);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1800;
        const tick = (t: number) => {
          const p = Math.min((t - start) / dur, 1);
          setVal(to * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toFixed(decimals)}
    </span>
  );
}

/* Tile with pointer spotlight */
function Tile({ className = "", children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div className={`tile ${className}`} data-reveal style={{ "--d": `${delay}ms` } as CSSProperties} onMouseMove={onMove}>
      {children}
    </div>
  );
}

/* deterministic scatter for the point cloud */
const cloud = Array.from({ length: 110 }).map((_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: 70 + r(1) * 460, y: 90 + r(2) * 280, s: 1 + r(3) * 2.2, d: r(4) * 3 };
});

function Visual({ type }: { type: string }) {
  if (type === "track") {
    return (
      <div className="vis" aria-hidden="true">
        <span className="live mono">
          <i /> TRACKING
        </span>
        <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.14" />
            </linearGradient>
          </defs>
          <rect width="600" height="460" fill="url(#road)" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${300 + (i - 1.5) * 20} 200 L${300 + (i - 1.5) * 190} 460`} stroke="#fff" strokeOpacity=".14" />
          ))}
          <path d="M70 380C170 350 210 270 320 250S480 190 560 110" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.5" />
          <path className="dash-flow" d="M320 250C430 225 500 160 560 110" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <g className="box-move">
            <rect x="140" y="170" width="170" height="110" rx="14" fill="none" stroke="#fff" strokeWidth="2" />
            <rect x="140" y="140" width="112" height="24" rx="12" fill="#fff" />
            <text x="154" y="156" fontSize="11" fontWeight="700" fill="#ff5c7a" fontFamily="JetBrains Mono">VEHICLE 0.93</text>
          </g>
          <g>
            <rect x="420" y="250" width="76" height="130" rx="14" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeDasharray="4 5" />
            <rect x="420" y="220" width="100" height="24" rx="12" fill="rgba(255,255,255,.3)" />
            <text x="432" y="236" fontSize="11" fontWeight="700" fill="#fff" fontFamily="JetBrains Mono">PERSON 0.87</text>
          </g>
        </svg>
        <span className="tag mono">PREDICTION HORIZON · 2.4 s</span>
      </div>
    );
  }

  if (type === "swarm") {
    const nodes: [number, number, string][] = [
      [120, 300, "R2"],
      [300, 170, "L1"],
      [450, 300, "R3"],
      [520, 150, "R4"],
      [280, 370, "R5"],
    ];
    return (
      <div className="vis" aria-hidden="true">
        <span className="live mono">
          <i /> LEADER ACTIVE
        </span>
        <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice">
          <path d="M-20 130C90 70 150 190 240 130s150-80 240-20 110 30 160-10" fill="none" stroke="#fff" strokeOpacity=".1" strokeWidth="60" strokeLinecap="round" />
          <path d="M-20 350c90-70 190 10 270-30s170-40 240 10 110 20 140-10" fill="none" stroke="#fff" strokeOpacity=".1" strokeWidth="70" strokeLinecap="round" />
          {[
            [0, 1],
            [1, 2],
            [1, 3],
            [0, 4],
            [4, 2],
            [1, 4],
          ].map(([a, b]) => (
            <line key={`${a}${b}`} className="dash-flow" x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#fff" strokeOpacity=".65" strokeWidth="1.6" />
          ))}
          {nodes.map(([x, y, label]) => {
            const lead = label === "L1";
            return (
              <g key={label}>
                {lead && <circle className="leader-ring" cx={x} cy={y} r="26" fill="none" stroke="#fff" strokeWidth="2" />}
                <circle cx={x} cy={y} r={lead ? 26 : 20} fill={lead ? "#fff" : "rgba(255,255,255,.2)"} stroke="#fff" strokeOpacity=".8" />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="JetBrains Mono" fill={lead ? "#0d9b7b" : "#fff"}>
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
        <span className="tag mono">DECENTRALIZED · NO CENTRAL CONTROLLER</span>
      </div>
    );
  }

  return (
    <div className="vis" aria-hidden="true">
      <span className="live mono">
        <i /> RECONSTRUCTING
      </span>
      <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity=".45" />
          </linearGradient>
        </defs>
        <g stroke="#fff" strokeOpacity=".2" fill="none">
          <path d="M60 380 L150 110 L450 110 L540 380 Z" />
          {[0.25, 0.5, 0.75].map((t) => (
            <path key={t} d={`M${60 + 90 * t} ${380 - 270 * t} L${540 - 90 * t} ${380 - 270 * t}`} />
          ))}
          {[0.25, 0.5, 0.75].map((t) => (
            <path key={`v${t}`} d={`M${150 + 300 * t} 110 L${60 + 480 * t} 380`} />
          ))}
        </g>
        {cloud.map((p, i) => (
          <circle key={i} className="pt" cx={p.x} cy={p.y} r={p.s} fill="#fff" style={{ animationDelay: `${p.d}s` }} />
        ))}
        <g className="scan-line">
          <rect x="40" y="60" width="520" height="50" fill="url(#scan)" />
          <line x1="40" y1="110" x2="560" y2="110" stroke="#fff" strokeWidth="2" />
        </g>
        <circle r="9" fill="#fff">
          <animateMotion dur="9s" repeatCount="indefinite" path="M150 330 C 250 360 350 280 430 320 S 400 240 250 250 S 150 330 150 330" />
        </circle>
      </svg>
      <span className="tag mono">3D GAUSSIAN SPLATTING · 27.4 dB PSNR</span>
    </div>
  );
}

/* ───────── App ───────── */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");
  const progress = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    nodes.forEach((n) => io.observe(n));

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current?.style.setProperty("--p", String(max > 0 ? window.scrollY / max : 0));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ["experience", "work", "research"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    return () => {
      io.disconnect();
      spy.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const close = () => setMenuOpen(false);
  const cls = (id: string) => (active === id ? "active" : "");

  return (
    <div>
      <div className="progress" ref={progress} aria-hidden="true" />

      <header className="nav">
        <a href="#top" className="logo" aria-label="Devkarthik Suresh, home">
          DS
        </a>
        <button type="button" className="menu-btn" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "Close" : "Menu"}
        </button>
        <nav className={`nav-links ${menuOpen ? "open" : ""}`} aria-label="Primary">
          <a href="#experience" className={cls("experience")} onClick={close}>Experience</a>
          <a href="#work" className={cls("work")} onClick={close}>Work</a>
          <a href="#research" className={cls("research")} onClick={close}>Research</a>
          <a href="#contact" className="cta" onClick={close}>Get in touch</a>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" id="top">
          <div className="aurora" aria-hidden="true">
            <span /><span /><span />
          </div>

          <div className="float-chip chip-a" aria-hidden="true">
            <span className="dot" style={{ background: "linear-gradient(135deg,#6d5efc,#a79bff)" }} />
            <div><b>4×</b><small>faster IK solver</small></div>
          </div>
          <div className="float-chip chip-b" aria-hidden="true">
            <span className="dot" style={{ background: "linear-gradient(135deg,#ff7a59,#ff5c8a)" }} />
            <div><b>2</b><small>papers accepted</small></div>
          </div>
          <div className="float-chip chip-c" aria-hidden="true">
            <span className="dot" style={{ background: "linear-gradient(135deg,#36d6a8,#5cc8ff)" }} />
            <div><b>−60%</b><small>map memory</small></div>
          </div>
          <div className="float-chip chip-d" aria-hidden="true">
            <span className="dot" style={{ background: "linear-gradient(135deg,#ffc46b,#ff7a59)" }} />
            <div><b>91.3%</b><small>detection precision</small></div>
          </div>

          <div className="wrap hero-inner">
            <span className="pill"><i /> Robotics · Computer Vision · Embedded AI</span>
            <h1>
              Machines that <span className="serif grad-text">see,</span> learn &amp; move
              <span className="serif grad-text"> with intent.</span>
            </h1>
            <p className="hero-sub">
              I’m Devkarthik Suresh. I design perception, learning, and control systems that help robots understand the
              world and act reliably within it.
            </p>
            <div className="hero-cta">
              <a className="btn dark" href="#work">See my work <Arrow /></a>
              <a className="btn ghost" href="/Devkarthik-Suresh-CV.pdf" download>Download CV</a>
            </div>
          </div>
          <span className="scroll-cue" aria-hidden="true" />
        </section>

        {/* NUMBERS */}
        <section className="sec" style={{ paddingTop: 40 }}>
          <div className="wrap">
            <div className="head-center" data-reveal>
              <span className="kicker">By the numbers</span>
              <h2 className="sec-title">
                Measured, tested, <span className="serif">proven.</span>
              </h2>
            </div>
            <div className="bento">
              <Tile className="span-7 t-violet stat-tile">
                <span className="stat-label">Inverse kinematics · ISRO VSSC</span>
                <div>
                  <div className="stat-num"><Count to={4} /><sub>× faster</sub></div>
                  <p className="stat-note">Closed-form solver versus ROS KDL, with error below 0.0016 mm.</p>
                </div>
              </Tile>
              <Tile className="span-5 t-coral stat-tile" delay={100}>
                <span className="stat-label">MobileGS Rover</span>
                <div>
                  <div className="stat-num">−<Count to={60} /><sub>%</sub></div>
                  <p className="stat-note">Map memory saved by pruning redundant Gaussians.</p>
                </div>
              </Tile>
              <Tile className="span-4 t-mint stat-tile">
                <span className="stat-label">Collision avoidance</span>
                <div>
                  <div className="stat-num"><Count to={91.3} decimals={1} /><sub>%</sub></div>
                  <p className="stat-note">Detection precision on a Raspberry Pi 4.</p>
                </div>
              </Tile>
              <Tile className="span-4 t-ink stat-tile" delay={100}>
                <span className="stat-label">APIS swarm</span>
                <div>
                  <div className="stat-num"><Count to={4.2} decimals={1} /><sub>s</sub></div>
                  <p className="stat-note">Average time to elect a new leader after a failure.</p>
                </div>
              </Tile>
              <Tile className="span-4 t-sun stat-tile" delay={200}>
                <span className="stat-label">UCL soft robotics</span>
                <div>
                  <div className="stat-num"><Count to={64} /><sub>-D</sub></div>
                  <p className="stat-note">Latent space compressing 1,024 points of arm shape.</p>
                </div>
              </Tile>
            </div>
          </div>
        </section>

        {/* FOCUS */}
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div data-reveal>
              <span className="kicker">What I work on</span>
              <h2 className="sec-title">
                From sensing the world <span className="serif">to moving through it.</span>
              </h2>
              <p className="sec-lead">
                My work sits where software meets hardware. Not isolated models, but systems that perceive, decide, and
                perform under real constraints.
              </p>
            </div>
            <div className="bento" style={{ marginTop: 56 }}>
              <Tile className="span-4 focus-tile">
                <div className="focus-art">
                  <svg viewBox="0 0 120 120" fill="none">
                    <circle className="spin" cx="60" cy="60" r="52" stroke="#6d5efc" strokeWidth="2" strokeDasharray="4 8" />
                    <circle cx="60" cy="60" r="34" fill="#efecff" stroke="#6d5efc" strokeWidth="2" />
                    <circle className="pulse" cx="60" cy="60" r="16" fill="#6d5efc" />
                    <circle cx="66" cy="54" r="5" fill="#fff" />
                  </svg>
                </div>
                <div>
                  <h3>Perception</h3>
                  <p>Computer vision and 3D geometry that turn camera and sensor data into useful understanding.</p>
                </div>
              </Tile>
              <Tile className="span-4 focus-tile" delay={100}>
                <div className="focus-art">
                  <svg viewBox="0 0 120 120" fill="none">
                    <g stroke="#ff7a59" strokeWidth="2">
                      <path className="dash-flow" d="M60 20 24 90M60 20 96 90M24 90H96" />
                    </g>
                    <circle className="pulse" cx="60" cy="20" r="14" fill="#ff7a59" />
                    <circle cx="24" cy="90" r="14" fill="#ffe3da" stroke="#ff7a59" strokeWidth="2" />
                    <circle cx="96" cy="90" r="14" fill="#ffe3da" stroke="#ff7a59" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <h3>Learning</h3>
                  <p>Models that learn compact representations, quantify uncertainty, and adapt to new information.</p>
                </div>
              </Tile>
              <Tile className="span-4 focus-tile" delay={200}>
                <div className="focus-art">
                  <svg viewBox="0 0 120 120" fill="none">
                    <circle cx="60" cy="60" r="50" stroke="#27c8a0" strokeWidth="2" />
                    <g className="spin-r">
                      <circle cx="60" cy="60" r="32" stroke="#27c8a0" strokeWidth="2" strokeDasharray="6 6" />
                      <circle cx="60" cy="28" r="6" fill="#27c8a0" />
                    </g>
                    <path d="M60 4v112M4 60h112" stroke="#27c8a0" strokeOpacity=".35" />
                    <circle cx="60" cy="60" r="8" fill="#27c8a0" />
                  </svg>
                </div>
                <div>
                  <h3>Control</h3>
                  <p>Planning, optimization, and embedded systems that convert decisions into precise physical action.</p>
                </div>
              </Tile>
            </div>
          </div>
        </section>

        {/* EXPERIENCE */}
        <section className="sec dark-sec" id="experience">
          <div className="wrap">
            <div data-reveal>
              <span className="kicker">Experience</span>
              <h2 className="sec-title">
                Research with <span className="serif">real-world stakes.</span>
              </h2>
              <p className="sec-lead">
                Working across academic research and aerospace robotics has taught me to move from first principles to
                tested systems.
              </p>
            </div>
            <div className="xp-list">
              {experiences.map((x, i) => (
                <article className="xp" key={x.organization} data-reveal style={{ "--d": `${i * 80}ms` } as CSSProperties}>
                  <div className="xp-when mono">
                    {x.period}
                    <br />
                    {x.place}
                  </div>
                  <div>
                    <h3>{x.organization}</h3>
                    <p className="role">{x.position}</p>
                    <p className="desc">{x.description}</p>
                    {x.work.length > 0 && (
                      <ul>
                        {x.work.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    )}
                    <div className="result">
                      <span className="check">
                        <svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></svg>
                      </span>
                      <p>{x.takeaway}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* WORK */}
        <section className="sec" id="work">
          <div className="wrap">
            <div className="head-center" data-reveal>
              <span className="kicker">Selected work</span>
              <h2 className="sec-title">
                Problems, <span className="serif">not just projects.</span>
              </h2>
              <p className="sec-lead">
                Each project began with a practical constraint and ended with a system I could measure and test.
              </p>
            </div>
            <div style={{ marginTop: 56 }}>
              {projects.map((p, i) => (
                <article className={`case ${p.theme} ${i % 2 ? "flip" : ""}`} key={p.title} data-reveal>
                  <div className="case-body">
                    <div className="case-top">
                      <span className="idx mono">{p.index} — {p.field}</span>
                      <h3>{p.title}</h3>
                      <p className="intro">{p.intro}</p>
                      <div className="case-steps">
                        <div><span>Problem</span><p>{p.problem}</p></div>
                        <div><span>Built</span><p>{p.solution}</p></div>
                        <div className="out"><span>Outcome</span><p>{p.outcome}</p></div>
                      </div>
                    </div>
                    <Visual type={p.visual} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* RESEARCH */}
        <section className="sec" id="research" style={{ paddingTop: 20 }}>
          <div className="wrap">
            <div data-reveal>
              <span className="kicker">Publications</span>
              <h2 className="sec-title">
                Research, <span className="serif">clearly communicated.</span>
              </h2>
              <p className="sec-lead">
                Two sole-author papers accepted in 2026, spanning trustworthy AI and decentralized robotics.
              </p>
            </div>
            <div className="papers">
              <Tile className="paper t-ink">
                <div>
                  <span className="badge"><i /> Accepted</span>
                  <h3>Quantifying Visual Uncertainty in Industrial Inspection</h3>
                  <p className="d">
                    Two vision-language models, 1,020 clean and degraded images. Under heavy blur, accuracy collapsed
                    while confidence barely moved: a serious reliability gap.
                  </p>
                  <div className="bars">
                    <div className="bar"><em style={{ "--w": "76.5%" } as CSSProperties}>Accuracy, clean · 76.5%</em></div>
                    <div className="bar warn"><em style={{ "--w": "49%", background: "#ff7a59" } as CSSProperties}>Accuracy, blurred · 49%</em></div>
                    <div className="bar"><em style={{ "--w": "86.4%", background: "#a79bff" } as CSSProperties}>Reported confidence · 86.4%</em></div>
                  </div>
                </div>
                <p className="venue mono">NeurIPS 2026 · NewInML Workshop</p>
              </Tile>
              <Tile className="paper t-violet" delay={100}>
                <div>
                  <span className="badge"><i /> Accepted</span>
                  <h3>APIS: Coordination &amp; Collision Avoidance for Planetary Rover Swarms</h3>
                  <p className="d">
                    A decentralized system for rover teams exploring lunar lava tubes. The group elects a new leader when
                    one fails and keeps navigating without a central controller.
                  </p>
                  <div className="chips" style={{ marginTop: 28 }}>
                    {["RAFT-inspired", "FSM avoidance", "Webots", "4.2 s re-election", "1.98 m separation"].map((c) => (
                      <span key={c} className="chip" style={{ background: "rgba(255,255,255,.18)", color: "#fff", borderColor: "transparent" }}>{c}</span>
                    ))}
                  </div>
                </div>
                <p className="venue mono">IEEE INDISCON 2026 · IROS MAS-BW 2026</p>
              </Tile>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="sec" style={{ paddingTop: 20 }}>
          <div className="wrap">
            <div data-reveal>
              <span className="kicker">About &amp; toolkit</span>
              <h2 className="sec-title">
                Engineering across the <span className="serif">full stack of autonomy.</span>
              </h2>
            </div>
            <div className="about-grid">
              <Tile className="about-copy">
                <p>
                  I study Electronics &amp; Telecommunication Engineering at Symbiosis Institute of Technology, ranking in
                  the top 12% of my department. I also completed the University of Warwick’s Data Science and Machine
                  Learning summer school with an A+.
                </p>
                <p>
                  Outside research, I’m a karate black belt and district-level sprinter who led the core team behind a
                  1,500-person charity marathon. Experiences that shaped how I approach discipline, pressure, and teamwork.
                </p>
              </Tile>
              <Tile delay={100}>
                {[
                  ["Languages", ["Python", "C", "C++", "R", "Verilog"]],
                  ["Machine learning & vision", ["PyTorch", "TensorFlow", "OpenCV", "YOLO", "scikit-learn"]],
                  ["Robotics & embedded", ["ROS 1/2", "NVIDIA Jetson", "Raspberry Pi", "ESP32", "Webots", "FPGA"]],
                  ["Tools", ["MATLAB Simscape", "Git", "Linux", "SQL", "Streamlit"]],
                ].map(([title, items]) => (
                  <div className="skill-block" key={title as string}>
                    <h4>{title as string}</h4>
                    <div className="chips">
                      {(items as string[]).map((s) => (
                        <span className="chip" key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </Tile>
            </div>
            <div className="beyond">
              <Tile className="t-coral">
                <span>Karate</span>
                <b>Black belt</b>
                <p>Medallist in sparring competitions.</p>
              </Tile>
              <Tile className="t-sky" delay={100}>
                <span>Athletics</span>
                <b>100 · 200 · 400 m</b>
                <p>District-level sprinter, selected for nationals.</p>
              </Tile>
              <Tile className="t-mint" delay={200}>
                <span>Leadership</span>
                <b>1,500 runners</b>
                <p>Led a 20-member core team and 150+ volunteers.</p>
              </Tile>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="wrap" style={{ paddingBottom: 20 }}>
          <div className="contact" data-reveal>
            <h2>
              Building something that needs to <span className="serif">see, learn, or move?</span>
            </h2>
            <p>Open to research collaborations and engineering roles in robotics and AI.</p>
            <a className="btn white" href="mailto:devkarthik300@gmail.com">
              devkarthik300@gmail.com <Arrow diagonal />
            </a>
          </div>
        </section>
      </main>

      <div className="wrap">
        <footer>
          <span><strong>Devkarthik Suresh</strong> · Robotics &amp; AI Engineer</span>
          <div className="foot-links">
            <a href="https://github.com/DevkarthikSuresh" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://orcid.org/0009-0002-5009-4052" target="_blank" rel="noreferrer">ORCID</a>
            <a href="/Devkarthik-Suresh-CV.pdf" download>CV</a>
          </div>
          <span>© 2026</span>
        </footer>
      </div>
    </div>
  );
}
