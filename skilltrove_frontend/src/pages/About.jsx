import { motion } from 'framer-motion';
import { FaGithub as Github, FaLinkedin as Linkedin } from 'react-icons/fa';


const TEAM = [
  {
    name: 'Allampalli Vinaya Sarayu',
    role: 'Team Lead | NLP & Backend',
    roll: '23P31A1201',
    img: require('../assets/23P31A1201.jpeg')
  },
  {
    name: 'Gunti Prasanth Kumar',
    role: 'Frontend Developer',
    roll: '23P31A1285',
    img: require('../assets/23P31A1285.jpeg')
  },
  {
    name: 'Vasamsetti Sriram',
    role: 'Backend Developer',
    roll: '23P31A1232',
    img: require('../assets/23P31A1232.jpg')
  },
  {
    name: 'Pragada Vamsi',
    role: 'Backend Developer',
    roll: '23P31A12B7',
    img: require('../assets/23P31A12B7.jpeg')
  },
  {
    name: 'Basa Vedhika Eshani',
    role: 'Frontend Developer',
    roll: '23P31A1202',
    img: require('../assets/23P31A1202.jpeg')
  },
  {
    name: 'Srikakulapu Gopala Venkata Gupta',
    role: 'Database Engineer',
    roll: '23P31A12C5',
    img: require('../assets/23P31A12C5.jpeg')
  },
];

export default function About() {
  return (
    <section className="min-h-screen bg-slate-950 py-20 px-6">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-8 max-w-6xl"
      >
        <div className="text-center mb-16 relative">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 md:text-5xl drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">Meet the Innovators</h1>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">The brilliant minds engineering the future of secure, AI-driven assessments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10, rotateY: 5, scale: 1.02 }}
              style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              className="group relative rounded-[2rem] border border-white/10 bg-slate-900 p-6 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:border-cyan-500/50 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-orange-500/0 via-transparent to-cyan-500/0 opacity-0 transition-opacity duration-500 group-hover:from-orange-500/10 group-hover:to-cyan-500/10 group-hover:opacity-100" />
              
              <div className="relative z-10 flex flex-col items-center text-center" style={{ transform: 'translateZ(30px)' }}>
                <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-slate-800 bg-black/50 shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:border-cyan-500 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                  <img src={member.img} alt={member.name} className="h-full w-full object-cover" />
                </div>
                
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{member.name}</h3>
                <p className="text-xs uppercase tracking-widest text-orange-400 mt-1">{member.role}</p>
                
                <div className="mt-4 flex gap-3 opacity-70 transition-opacity group-hover:opacity-100">
                  <a href={member.social.github} className="rounded-full bg-white/5 p-2 text-zinc-400 hover:bg-white/20 hover:text-white transition-colors">
                    <Github size={18} />
                  </a>
                  <a href={member.social.linkedin} className="rounded-full bg-white/5 p-2 text-zinc-400 hover:bg-white/20 hover:text-cyan-400 transition-colors">
                    <Linkedin size={18} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
