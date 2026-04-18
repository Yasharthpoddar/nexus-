import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  UploadCloud, 
  ArrowRight,
  ArrowLeft,
  FileBadge
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Shared Components ---

const InputField = ({ label, type = "text", error, ...props }: any) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-800 mb-1">{label}</label>
      <input 
        type={type}
        className={`w-full p-3 bg-[#F9F9F9] border-2 transition-colors outline-none focus:bg-white
          ${error ? 'border-[#D02020]' : 'border-[#121212] focus:border-[#1040C0]'}`}
        {...props}
      />
      {error && <p className="text-[#D02020] text-xs font-bold mt-1.5">{error}</p>}
    </div>
  );
};

// --- Main Auth Page Component ---

export function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [redirectingRole, setRedirectingRole] = useState('');

  // Triggered when any full authentication flow succeeds
  const completeAuthentication = (role: string) => {
    setRedirectingRole(role);
    setSuccessAnimation(true);
    setTimeout(() => {
      if (role === 'student') navigate('/dashboard');
      else if (role === 'authority') navigate('/authority/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white border-4 border-[#121212] flex flex-col shadow-[8px_8px_0px_0px_#121212] relative overflow-hidden">
        
        {/* Success Overlay */}
        <AnimatePresence>
          {successAnimation && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-[#1040C0] text-white flex flex-col items-center justify-center p-8"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <CheckCircle2 className="w-20 h-20 mb-6" />
              </motion.div>
              <h2 className="font-black text-2xl uppercase tracking-tight text-center">Authentication<br/>Successful</h2>
              <p className="text-sm font-medium opacity-80 mt-2 text-center">
                {redirectingRole === 'authority' ? 'Redirecting to Authority Portal...' : redirectingRole === 'admin' ? 'Redirecting to Admin Panel...' : 'Redirecting to your dashboard...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Logo */}
        <div className="pt-8 pb-4 flex justify-center">
           <div className="w-14 h-14 bg-[#F0C020] border-4 border-[#121212] rounded-full flex items-center justify-center">
              <span className="font-black text-xl tracking-tight leading-none translate-x-[1px]">NU</span>
           </div>
        </div>

        {/* Core View Router within Card */}
        {forgotPasswordMode ? (
          <ForgotPasswordView 
            onBack={() => setForgotPasswordMode(false)}
            onComplete={completeAuthentication}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b-4 border-[#121212] mx-6">
              <button 
                onClick={() => setActiveTab('signin')}
                className={`flex-1 pb-3 pt-2 font-black uppercase text-sm tracking-widest border-b-4 transition-colors ${
                  activeTab === 'signin' ? 'border-[#1040C0] text-[#1040C0]' : 'border-transparent text-gray-400 hover:text-[#121212]'
                }`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setActiveTab('register')}
                className={`flex-1 pb-3 pt-2 font-black uppercase text-sm tracking-widest border-b-4 transition-colors ${
                  activeTab === 'register' ? 'border-[#1040C0] text-[#1040C0]' : 'border-transparent text-gray-400 hover:text-[#121212]'
                }`}
              >
                Register
              </button>
            </div>

            <div className="p-6 md:p-8">
              {activeTab === 'signin' && (
                <SignInView 
                  onForgot={() => setForgotPasswordMode(true)}
                  onRegister={() => setActiveTab('register')}
                  onComplete={completeAuthentication}
                />
              )}
              {activeTab === 'register' && (
                <RegisterView 
                  onComplete={completeAuthentication}
                  onSignIn={() => setActiveTab('signin')}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Sign In Component ---

function SignInView({ onForgot, onRegister, onComplete }: any) {
  const [role, setRole] = useState<'student' | 'authority' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const domain = role === 'admin' ? '@nexus.edu' : '@college.edu';
  const isFormValid = email.includes(domain) && password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    // Constraints removed for now, accept any password that meets the domain
    onComplete(role);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    const requiredDomain = role === 'admin' ? '@nexus.edu' : '@college.edu';
    if (val && !val.includes(requiredDomain)) {
      setErrors({ ...errors, email: `Must use a valid ${requiredDomain} address` });
    } else {
      setErrors({ ...errors, email: null });
    }
  };

  // Re-validate email if role changes
  useEffect(() => {
    if (email) {
      const requiredDomain = role === 'admin' ? '@nexus.edu' : '@college.edu';
      if (!email.includes(requiredDomain)) {
        setErrors((prev: any) => ({ ...prev, email: `Must use a valid ${requiredDomain} address` }));
      } else {
        setErrors((prev: any) => ({ ...prev, email: null }));
      }
    }
  }, [role, email]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex border-4 border-[#121212] mb-6">
        <button 
          type="button" 
          onClick={() => setRole('student')} 
          className={`flex-1 py-2 font-black uppercase text-xs tracking-widest border-r-4 border-[#121212] transition-colors ${role === 'student' ? 'bg-[#121212] text-white' : 'bg-white text-[#121212] hover:bg-[#F0F0F0]'}`}
        >
          Student
        </button>
        <button 
          type="button" 
          onClick={() => setRole('authority')} 
          className={`flex-1 py-2 font-black uppercase text-xs tracking-widest border-r-4 border-[#121212] transition-colors ${role === 'authority' ? 'bg-[#121212] text-white' : 'bg-white text-[#121212] hover:bg-[#F0F0F0]'}`}
        >
          Authority
        </button>
        <button 
          type="button" 
          onClick={() => setRole('admin')} 
          className={`flex-1 py-2 font-black uppercase text-xs tracking-widest transition-colors ${role === 'admin' ? 'bg-[#121212] text-white' : 'bg-white text-[#121212] hover:bg-[#F0F0F0]'}`}
        >
          Admin
        </button>
      </div>

      <InputField 
        label={role === 'admin' ? 'Admin Email' : role === 'authority' ? 'Authority Email' : 'College Email'}
        type="email"
        placeholder={role === 'admin' ? 'admin@nexus.edu' : role === 'authority' ? 'prof.name@college.edu' : 'your.name@college.edu'} 
        value={email}
        onChange={handleEmailChange}
        error={errors.email}
      />
      
      <div className="mb-4 relative">
        <label className="block text-sm font-bold text-gray-800 mb-1">Password</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"}
            className={`w-full p-3 bg-[#F9F9F9] border-2 outline-none focus:bg-white focus:border-[#1040C0] ${errors.credentials ? 'border-[#D02020]' : 'border-[#121212]'}`}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, credentials: null }); }}
          />
          <button 
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.credentials && <p className="text-[#D02020] text-xs font-bold mt-1.5">{errors.credentials}</p>}
      </div>

      <div className="flex justify-between items-center mb-8">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="w-4 h-4 border-2 border-[#121212] accent-[#121212] cursor-pointer" />
          <span className="text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity">Remember me</span>
        </label>
        
        <button type="button" onClick={onForgot} className="text-sm font-bold text-[#1040C0] hover:underline">
          Forgot password?
        </button>
      </div>

      <button 
        type="submit"
        disabled={!isFormValid}
        className="w-full py-4 bg-[#121212] text-white font-black uppercase tracking-widest border-4 border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:shadow-[4px_4px_0px_0px_#1040C0] hover:-translate-y-1 transition-all"
      >
        Sign In
      </button>

      <div className="mt-6 text-center">
        <p className="text-sm font-bold opacity-80">
          Don't have an account?{' '}
          <button type="button" onClick={onRegister} className="text-[#1040C0] hover:underline">Register here</button>
        </p>
      </div>

      <div className="mt-8 pt-6 border-t font-medium text-xs text-center border-[#E0E0E0] opacity-50">
        Select your role above then sign in.
      </div>
    </form>
  );
}

// --- Forgot Password Component ---

function ForgotPasswordView({ onBack, onComplete }: any) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pwd, setPwd] = useState('');
  
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if(email.includes('@')) setStep(2);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if(otp.length === 6 && pwd.length >= 8) onComplete('student');
  }

  return (
    <div className="p-6 md:p-8 flex flex-col h-full min-h-[460px]">
      <h2 className="font-black text-2xl uppercase tracking-tight mb-2">Reset Password</h2>
      <p className="text-sm font-medium opacity-80 mb-8 pb-4 border-b-4 border-[#121212]">
        {step === 1 ? 'Enter your registered college email.' : 'Enter the OTP and your new password.'}
      </p>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="flex-1 flex flex-col">
          <InputField 
            label="College Email" 
            type="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!email.includes('@')}
            className="w-full mt-auto py-4 bg-[#1040C0] text-white font-black uppercase tracking-widest border-2 border-[#121212] disabled:opacity-50"
          >
            Send Reset OTP
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="flex-1 flex flex-col gap-4">
           {/* Custom OTP UI reused conceptually, simplified here for space or could use the exact OTP component */}
           <div>
             <label className="block text-sm font-bold text-gray-800 mb-1">6-Digit OTP</label>
             <input type="text" maxLength={6} className="w-full p-3 font-mono tracking-[0.5em] text-center bg-[#F9F9F9] border-2 border-[#121212] outline-none" value={otp} onChange={e=>setOtp(e.target.value)}/>
           </div>
           <InputField label="New Password" type="password" value={pwd} onChange={(e: any) => setPwd(e.target.value)} />
           
           <button 
            type="submit"
            disabled={otp.length !== 6 || pwd.length < 8}
            className="w-full mt-auto py-4 bg-[#D02020] text-white font-black uppercase tracking-widest border-2 border-[#121212] disabled:opacity-50"
          >
            Reset Password
          </button>
        </form>
      )}

      <button onClick={onBack} className="mt-6 text-sm font-bold text-center w-full opacity-60 hover:opacity-100 flex items-center justify-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to sign in
      </button>
    </div>
  );
}

// --- Register Wizard Component ---

function RegisterView({ onComplete, onSignIn }: any) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', enum: '', branch: '', year: '', phone: '',
    email: '', pass: '', confirmPass: '',
    file: null as File | null
  });

  const [errors, setErrors] = useState<any>({});

  const validateStep = () => {
    let errs: any = {};
    if (step === 1) {
      if (!formData.name) errs.name = "Required";
      if (!formData.enum) errs.enum = "Required";
      if (!formData.branch) errs.branch = "Required";
      if (!formData.year) errs.year = "Required";
      if (!formData.phone || formData.phone.length < 10) errs.phone = "Invalid number";
    }
    if (step === 2) {
      if (!formData.email.includes('@college.edu')) errs.email = "Must be @college.edu";
      if (formData.pass.length < 8) errs.pass = "Minimum 8 characters";
      if (formData.pass !== formData.confirmPass) errs.confirmPass = "Passwords do not match";
    }
    if (step === 3) {
      if (!formData.file) errs.file = "ID Card upload is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if(validateStep()) setStep(s => s + 1);
  };

  // OTP Component embedded
  const OtpStep = () => {
    const [otpValues, setOtpValues] = useState(Array(6).fill(""));
    const inputs = useRef<Array<HTMLInputElement | null>>([]);
    const [timer, setTimer] = useState(30);

    useEffect(() => {
      const interval = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
      return () => clearInterval(interval);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const val = e.target.value;
      if (/[^0-9]/.test(val)) return;

      const newOtp = [...otpValues];
      newOtp[index] = val;
      setOtpValues(newOtp);

      if (val && index < 5) inputs.current[index + 1]?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    };

    const isComplete = otpValues.join('').length === 6;

    return (
      <div className="flex flex-col h-full items-center">
        <p className="font-bold text-center mb-8">We've sent a 6-digit OTP to<br/><span className="text-[#1040C0]">{formData.email}</span></p>
        
        <div className="flex gap-2 justify-center w-full mb-8">
          {otpValues.map((val, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="text"
              maxLength={1}
              value={val}
              onChange={e => handleChange(e, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              className="w-12 h-14 bg-[#F9F9F9] border-2 border-[#121212] font-mono text-xl text-center outline-none focus:border-[#1040C0]"
            />
          ))}
        </div>

        <button 
           type="button"
           disabled={timer > 0} 
           onClick={() => setTimer(30)}
           className="text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:underline mb-auto"
        >
          {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP now'}
        </button>

        <button 
          type="button"
          onClick={() => onComplete('student')}
          disabled={!isComplete}
          className="w-full mt-8 py-4 bg-[#1040C0] text-white font-black uppercase tracking-widest border-2 border-[#121212] disabled:opacity-50 hover:shadow-[4px_4px_0px_#121212] transition-shadow"
        >
          Verify & Activate
        </button>
      </div>
    );
  };

  const getPassStrength = () => {
    let s = 0;
    if(formData.pass.length > 5) s+=1;
    if(formData.pass.length >= 8) s+=1;
    if(/[A-Z]/.test(formData.pass)) s+=1;
    if(/[0-9]/.test(formData.pass)) s+=1;
    return s; // 0 to 4
  }

  return (
    <div className="flex flex-col h-full min-h-[460px]">
      
      {/* Wizard Progress */}
      <div className="flex items-center gap-1 mb-6">
        {[1,2,3,4].map((s) => (
          <div key={s} className="flex-1 h-2 bg-[#E0E0E0] border border-[#121212] overflow-hidden">
            <div className={`h-full bg-[#121212] transition-all duration-300 ${s <= step ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>
      <h2 className="font-black text-xl uppercase tracking-tight mb-6">
        {step === 1 && 'Personal Details'}
        {step === 2 && 'Account Setup'}
        {step === 3 && 'ID Verification'}
        {step === 4 && 'Email Verification'}
      </h2>

      {/* Step Contents */}
      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <div className="space-y-4">
            <InputField label="Full Name" value={formData.name} onChange={(e:any) => setFormData({...formData, name: e.target.value})} error={errors.name} />
            <InputField label="Enrollment No" value={formData.enum} onChange={(e:any) => setFormData({...formData, enum: e.target.value})} error={errors.enum} />
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-800 mb-1">Branch</label>
                <select className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none" value={formData.branch} onChange={(e:any) => setFormData({...formData, branch: e.target.value})}>
                  <option value="">Select</option>
                  {['CSE', 'IT', 'ECE', 'Mechanical', 'Civil'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-800 mb-1">Pass Year</label>
                <select className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none" value={formData.year} onChange={(e:any) => setFormData({...formData, year: e.target.value})}>
                  <option value="">Select</option>
                  {['2024', '2025', '2026', '2027'].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <InputField label="Mobile Number" type="tel" value={formData.phone} onChange={(e:any) => setFormData({...formData, phone: e.target.value})} error={errors.phone} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <InputField 
              label="College Email" 
              type="email"
              placeholder="@college.edu"
              value={formData.email} 
              onChange={(e:any) => {
                 setFormData({...formData, email: e.target.value});
                 if (e.target.value && !e.target.value.includes('@college.edu')) {
                    setErrors({...errors, email: 'Must be a valid @college.edu domain.'});
                 } else {
                    setErrors({...errors, email: null});
                 }
              }} 
              error={errors.email} 
            />
            
            <div className="mb-4">
              <InputField 
                label="Password" 
                type="password"
                value={formData.pass} 
                onChange={(e:any) => setFormData({...formData, pass: e.target.value})} 
                error={errors.pass} 
              />
              {/* Strength Bar */}
              <div className="flex gap-1 h-1.5 -mt-2">
                <div className={`flex-1 ${getPassStrength() >= 1 ? 'bg-[#D02020]' : 'bg-[#E0E0E0]'}`} />
                <div className={`flex-1 ${getPassStrength() >= 2 ? 'bg-[#F0C020]' : 'bg-[#E0E0E0]'}`} />
                <div className={`flex-1 ${getPassStrength() >= 3 ? 'bg-[#F0C020]' : 'bg-[#E0E0E0]'}`} />
                <div className={`flex-1 ${getPassStrength() >= 4 ? 'bg-[#1040C0]' : 'bg-[#E0E0E0]'}`} />
              </div>
            </div>

            <InputField label="Confirm Password" type="password" value={formData.confirmPass} onChange={(e:any) => setFormData({...formData, confirmPass: e.target.value})} error={errors.confirmPass} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col h-full">
            <label className="block text-sm font-bold text-gray-800 mb-1">Upload College ID</label>
            <div className={`flex-1 flex flex-col items-center justify-center border-4 border-dashed bg-[#F9F9F9] transition-colors ${errors.file ? 'border-[#D02020]' : 'border-[#121212]'}`}>
              {formData.file ? (
                <div className="flex flex-col items-center p-6 text-center">
                  <FileBadge className="w-12 h-12 text-[#1040C0] mb-2" />
                  <p className="font-bold text-sm line-clamp-1 break-all">{formData.file.name}</p>
                  <button onClick={() => setFormData({...formData, file: null})} className="text-xs font-bold uppercase tracking-widest mt-4 text-[#D02020] hover:underline">Remove</button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center p-8 text-center h-full w-full justify-center hover:bg-[#F0F0F0]">
                  <UploadCloud className="w-10 h-10 mb-2 opacity-80" />
                  <p className="font-bold text-sm">Click to upload ID Card</p>
                  <p className="text-xs font-medium opacity-60 mt-1">Accepts JPG/PDF (Max 2MB)</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if(file) {
                        if(file.size > 2000000) setErrors({...errors, file: 'File exceeds 2MB'});
                        else {
                          setFormData({...formData, file});
                          setErrors({...errors, file: null});
                        }
                      }
                    }} 
                  />
                </label>
              )}
            </div>
            {errors.file && <p className="text-[#D02020] text-xs font-bold mt-2 text-center">{errors.file}</p>}
          </div>
        )}

        {step === 4 && <OtpStep />}
        
        {/* Navigation Buttons for Step 1-3 */}
        {step < 4 && (
          <div className="flex gap-4 mt-8 pt-6 border-t-4 border-[#121212]">
            {step > 1 && (
               <button 
                 onClick={() => setStep(s => s - 1)}
                 className="px-4 py-3 bg-white border-4 border-[#121212] font-bold uppercase text-sm tracking-widest hover:bg-[#F0F0F0]"
               >
                 Back
               </button>
            )}
            <button 
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-[#121212] text-white font-black uppercase text-sm tracking-widest border-4 border-[#121212] hover:bg-[#F0C020] hover:text-[#121212] flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
