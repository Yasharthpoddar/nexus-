import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import {
  Upload,
  CheckCircle,
  Award,
  QrCode,
  FileText,
  DollarSign,
  FileCheck,
  Clock,
  Shield,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { BauhausButton } from '../components/BauhausButton';
import { StepCard } from '../components/StepCard';
import { FeatureCard } from '../components/FeatureCard';
import { PaymentCard } from '../components/PaymentCard';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'student') return navigate('/dashboard', { replace: true });
      const effectiveRole = currentUser.sub_role || currentUser.role;
      switch(effectiveRole) {
        case 'lab-incharge': return navigate('/lab/dashboard', { replace: true });
        case 'hod': return navigate('/hod/dashboard', { replace: true });
        case 'principal': return navigate('/principal/dashboard', { replace: true });
        case 'admin': return navigate('/admin/dashboard', { replace: true });
        default: return navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <HeroSection />
      <StatsBar />
      <WorkflowSection />
      <FeaturesGrid />
      <DashboardPreview />
      <PaymentSection />
      <QRVerification />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="min-h-screen flex border-b-4 border-[#121212]">
      <div className="w-full lg:w-[55%] bg-white border-r-4 border-[#121212] flex flex-col">
        <nav className="px-8 lg:px-20 py-6 flex items-center justify-between border-b-4 border-[#121212]">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="font-bold uppercase text-sm hover:text-[#D02020]">
              Features
            </a>
            <a href="#" className="font-bold uppercase text-sm hover:text-[#D02020]">
              Pricing
            </a>
            <a href="#" className="font-bold uppercase text-sm hover:text-[#D02020]">
              About
            </a>
            <BauhausButton variant="red" onClick={() => navigate('/login')}>Get Started</BauhausButton>
          </div>
        </nav>

        <div className="flex-1 px-8 lg:px-20 py-16 lg:py-24 flex flex-col justify-center">
          <motion.h1
            className="font-black text-4xl lg:text-7xl xl:text-8xl uppercase leading-[0.9] mb-8"
            style={{ letterSpacing: '-0.04em' }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            AUTOMATE YOUR GRADUATION CLEARANCE.
          </motion.h1>

          <p className="font-medium text-lg leading-relaxed max-w-lg mb-8">
            Nexus streamlines college clearance workflows — from dues tracking to digital
            certificates — cutting approval time from weeks to hours.
          </p>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-[#E0E0E0] border-2 border-[#121212]"
                />
              ))}
            </div>
            <p className="font-bold uppercase text-xs tracking-widest">
              Trusted by 12,000+ students
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <BauhausButton variant="red" onClick={() => navigate('/login')}>GET STARTED →</BauhausButton>
            <BauhausButton variant="outline">SEE HOW IT WORKS</BauhausButton>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-[45%] bg-[#1040C0] items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)',
            backgroundSize: '20px 20px'
          }}
        />

        <motion.div
          className="relative z-10 flex items-center justify-center"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute w-64 h-64 rounded-full bg-white opacity-50" />
          <div
            className="absolute w-56 h-56 bg-[#121212] opacity-40"
            style={{ transform: 'rotate(45deg)' }}
          />
          <div className="relative w-48 h-48 bg-[#F0C020] border-4 border-[#121212] flex items-center justify-center">
            <div
              className="w-32 h-32 bg-white border-4 border-[#121212]"
              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { number: '12,000+', label: 'Students', shape: 'circle' },
    { number: '98%', label: 'Clearance Rate', shape: 'square' },
    { number: '3', label: 'Approval Steps', shape: 'circle' },
    { number: '< 48', label: 'Hours', shape: 'square' }
  ];

  return (
    <section className="bg-[#F0C020] border-b-4 border-[#121212]">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-8 flex flex-col items-center justify-center gap-4 ${
              index < stats.length - 1 ? 'border-r-4 border-[#121212]' : ''
            }`}
          >
            <div
              className={`w-24 h-24 flex items-center justify-center bg-[#121212] border-4 border-[#121212] ${
                stat.shape === 'circle' ? 'rounded-full' : ''
              }`}
              style={stat.shape === 'square' ? { transform: 'rotate(45deg)' } : {}}
            >
              <span
                className="font-black text-3xl text-[#F0C020]"
                style={stat.shape === 'square' ? { transform: 'rotate(-45deg)' } : {}}
              >
                {stat.number}
              </span>
            </div>
            <p className="font-bold uppercase text-xs tracking-widest text-[#121212]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkflowSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const steps = [
    {
      icon: <Upload className="w-8 h-8" strokeWidth={2} />,
      title: 'STUDENT SUBMITS DOCUMENTS & CLEARS DUES'
    },
    {
      icon: <CheckCircle className="w-8 h-8" strokeWidth={2} />,
      title: 'HOD REVIEWS & APPROVES'
    },
    {
      icon: <Award className="w-8 h-8" strokeWidth={2} />,
      title: 'PRINCIPAL SIGNS OFF'
    },
    {
      icon: <QrCode className="w-8 h-8" strokeWidth={2} />,
      title: 'DIGITAL CERTIFICATE ISSUED'
    }
  ];

  return (
    <section ref={ref} className="py-24 border-b-4 border-[#121212]">
      <div className="max-w-7xl mx-auto px-8">
        <p className="font-bold uppercase text-xs tracking-widest mb-4">HOW IT WORKS</p>
        <h2
          className="font-black text-4xl lg:text-6xl uppercase mb-16"
          style={{ letterSpacing: '-0.04em' }}
        >
          THREE STEPS. ZERO PAPERWORK.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.2 }}
            >
              <StepCard stepNumber={index + 1} icon={step.icon} title={step.title} />
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 items-center justify-center -translate-y-1/2"
                     style={{ left: `${(index + 1) * 25 - 2}%` }}>
                  <ChevronRight className="w-8 h-8" strokeWidth={4} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    {
      icon: <FileText className="w-8 h-8" strokeWidth={2} />,
      title: 'Document Upload',
      description: 'Bulk upload and organize clearance documents with automatic validation.',
      decorationColor: 'red' as const,
      decorationShape: 'circle' as const
    },
    {
      icon: <DollarSign className="w-8 h-8" strokeWidth={2} />,
      title: 'Dues Tracking',
      description: 'Real-time dues monitoring across library, hostel, and lab departments.',
      decorationColor: 'blue' as const,
      decorationShape: 'square' as const
    },
    {
      icon: <FileCheck className="w-8 h-8" strokeWidth={2} />,
      title: 'Digital Certificates',
      description: 'Blockchain-verified digital clearance certificates with QR codes.',
      decorationColor: 'yellow' as const,
      decorationShape: 'triangle' as const
    },
    {
      icon: <Clock className="w-8 h-8" strokeWidth={2} />,
      title: 'Real-time Status',
      description: 'Track approval progress at every stage with live notifications.',
      decorationColor: 'red' as const,
      decorationShape: 'square' as const
    },
    {
      icon: <QrCode className="w-8 h-8" strokeWidth={2} />,
      title: 'QR Verification',
      description: 'Instant certificate verification via QR code scanning.',
      decorationColor: 'blue' as const,
      decorationShape: 'triangle' as const
    },
    {
      icon: <Shield className="w-8 h-8" strokeWidth={2} />,
      title: 'Audit Trail',
      description: 'Immutable audit logs for compliance and record-keeping.',
      decorationColor: 'yellow' as const,
      decorationShape: 'circle' as const
    }
  ];

  return (
    <section className="py-24 border-b-4 border-[#121212]">
      <div className="max-w-7xl mx-auto px-8">
        <h2
          className="font-black text-4xl lg:text-6xl uppercase mb-16"
          style={{ letterSpacing: '-0.04em' }}
        >
          EVERYTHING THE REGISTRAR NEEDS.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="bg-[#D02020] border-b-4 border-[#121212] py-24">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <p className="font-bold uppercase text-xs tracking-widest mb-4 opacity-90">
              ADMIN DASHBOARD
            </p>
            <h2
              className="font-black text-4xl lg:text-5xl uppercase mb-6"
              style={{ letterSpacing: '-0.04em' }}
            >
              SEE EVERY STUDENT'S STATUS AT A GLANCE.
            </h2>
            <p className="text-lg leading-relaxed mb-6 opacity-95">
              Monitor clearance progress with our powerful dashboard. Heatmaps, analytics, and
              real-time updates keep you in control.
            </p>
            <a href="#" className="font-bold uppercase text-sm underline hover:no-underline">
              VIEW DASHBOARD →
            </a>
          </div>

          <div
            className="bg-white border-4 border-[#121212]"
            style={{ boxShadow: '8px 8px 0px 0px #121212' }}
          >
            <div className="bg-[#121212] p-4 border-b-4 border-[#121212] flex items-center justify-between">
              <span className="font-black text-white text-sm">NEXUS ADMIN</span>
              <div className="w-8 h-8 rounded-full bg-[#E0E0E0] border-2 border-white" />
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'CLEARED', value: '1,248', color: '#F0C020' },
                  { label: 'PENDING', value: '312', color: '#1040C0' },
                  { label: 'OUTSTANDING', value: '88', color: '#D02020' }
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white border-4 border-[#121212] p-4"
                    style={{ boxShadow: '4px 4px 0px 0px #121212' }}
                  >
                    <p className="font-bold uppercase text-[10px] tracking-widest mb-2">
                      {stat.label}
                    </p>
                    <p className="font-black text-2xl" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 80 }).map((_, i) => {
                  const colors = ['#F0C020', '#1040C0', '#D02020'];
                  const weights = [0.65, 0.25, 0.1];
                  const rand = Math.random();
                  let color = colors[0];
                  let sum = 0;
                  for (let j = 0; j < weights.length; j++) {
                    sum += weights[j];
                    if (rand < sum) {
                      color = colors[j];
                      break;
                    }
                  }

                  return (
                    <motion.div
                      key={i}
                      className="w-full aspect-square border-2 border-[#121212]"
                      style={{ backgroundColor: color }}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.01 }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PaymentSection() {
  return (
    <section className="bg-[#F0C020] border-b-4 border-[#121212] py-24">
      <div className="max-w-7xl mx-auto px-8">
        <h2
          className="font-black text-4xl lg:text-5xl uppercase mb-12 text-center"
          style={{ letterSpacing: '-0.04em' }}
        >
          CLEAR YOUR DUES IN ONE TAP.
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <PaymentCard title="Library Fine" amount={450} buttonVariant="red" buttonText="PAY NOW" />
          <PaymentCard
            title="Lab Deposit"
            amount={1200}
            buttonVariant="blue"
            buttonText="PAY NOW"
          />
          <div
            className="bg-white border-4 border-[#121212] p-6 flex flex-col gap-4"
            style={{ boxShadow: '8px 8px 0px 0px #121212' }}
          >
            <p className="font-bold uppercase tracking-widest text-xs">Hostel Dues</p>
            <p className="font-black text-5xl">₹0</p>
            <div className="w-full border-4 border-[#121212] bg-[#F0C020] text-[#121212] px-8 py-4 font-bold uppercase tracking-wide text-sm text-center">
              CLEARED
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QRVerification() {
  return (
    <section className="py-24 border-b-4 border-[#121212]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div
              className="bg-white border-4 border-[#121212] p-8 inline-block"
              style={{ boxShadow: '8px 8px 0px 0px #121212' }}
            >
              <div className="w-64 h-64 bg-white border-4 border-[#121212] relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 p-2">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${
                        Math.random() > 0.5 ? 'bg-[#121212]' : 'bg-white'
                      }`}
                    />
                  ))}
                </div>

                <motion.div
                  className="absolute left-0 w-full h-1 bg-[#D02020]"
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </div>
          </div>

          <div>
            <h2
              className="font-black text-4xl lg:text-5xl uppercase mb-6"
              style={{ letterSpacing: '-0.04em' }}
            >
              VERIFY ANY CERTIFICATE INSTANTLY.
            </h2>
            <p className="text-lg leading-relaxed mb-8">
              Scan QR codes to authenticate clearance certificates instantly. Blockchain-backed
              verification ensures authenticity.
            </p>

            <div className="space-y-4">
              {[
                'Issued by registrar',
                'Immutable audit log',
                'Works offline after first scan'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#F0C020] border-4 border-[#121212] flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" strokeWidth={3} />
                  </div>
                  <p className="font-medium text-lg">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="bg-[#F0C020] border-b-4 border-[#121212] py-24 relative overflow-hidden">
      <div
        className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#D02020] opacity-50"
        style={{ transform: 'translate(-50%, 50%)' }}
      />
      <div
        className="absolute top-0 right-0 w-64 h-64 bg-[#1040C0] opacity-50"
        style={{ transform: 'translate(50%, -50%) rotate(45deg)' }}
      />

      <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
        <h2
          className="font-black text-5xl lg:text-8xl uppercase mb-6"
          style={{ letterSpacing: '-0.04em' }}
        >
          YOUR CLEARANCE. DONE.
        </h2>
        <p className="text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
          Join thousands of students and institutions streamlining graduation clearance.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <BauhausButton variant="red" onClick={() => navigate('/login')}>APPLY FOR CLEARANCE →</BauhausButton>
          <BauhausButton variant="outline">LEARN MORE</BauhausButton>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#121212] text-white border-t-4 border-[#F0C020]">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <div className="w-6 h-6 rounded-full bg-[#D02020] border-2 border-white" />
                  <div className="w-6 h-6 bg-[#1040C0] border-2 border-white" />
                  <div
                    className="w-6 h-6 bg-[#F0C020] border-2 border-white"
                    style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                  />
                </div>
                <span className="font-black text-lg tracking-tight">NEXUS</span>
              </div>
            </div>
            <p className="text-sm opacity-75">
              Automated clearance protocol for modern institutions.
            </p>
          </div>

          <div>
            <h4 className="font-bold uppercase text-xs tracking-widest mb-4">Product</h4>
            <ul className="space-y-2 text-sm opacity-75">
              <li>
                <a href="#" className="hover:text-[#F0C020]">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#F0C020]">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#F0C020]">
                  Security
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase text-xs tracking-widest mb-4">Resources</h4>
            <ul className="space-y-2 text-sm opacity-75">
              <li>
                <a href="#" className="hover:text-[#F0C020]">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#F0C020]">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#F0C020]">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase text-xs tracking-widest mb-4">Contact</h4>
            <ul className="space-y-2 text-sm opacity-75">
              <li>
                <a href="#" className="hover:text-[#F0C020]">
                  Email
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#F0C020]">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#F0C020]">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t-2 border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-75">© 2026 NEXUS. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-white hover:bg-[#F0C020] hover:border-[#F0C020] transition-colors cursor-pointer"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}