import { motion } from 'framer-motion';
import { FaGithub as Github, FaLinkedin as Linkedin } from 'react-icons/fa';

/**
 * @typedef {Object} SocialLinks
 * @property {string} github - GitHub profile URL
 * @property {string} linkedin - LinkedIn profile URL
 */

/**
 * @typedef {Object} TeamMember
 * @property {string} name - Full name of the member
 * @property {string} role - Project role
 * @property {string} roll - Academic roll number
 * @property {any} img - Required image asset
 * @property {SocialLinks} social - Verified social media profiles
 */

/**
 * @type {TeamMember[]}
 * @description The core team responsible for SkillTrove development and architecture.
 */
const TEAM = [
  {
    name: 'Allampalli Vinaya Sarayu',
    role: 'Team Lead | NLP & Backend',
    roll: '23P31A1201',
    img: require('../assets/23P31A1201.jpeg'),
    social: { 
      github: 'https://github.com/Sarayu1201', 
      linkedin: 'https://www.linkedin.com/in/vinaya-sarayu-660b72290' 
    }
  },
  {
    name: 'Gunti Prasanth Kumar',
    role: 'Frontend Developer',
    roll: '23P31A1285',
    img: require('../assets/23P31A1285.jpeg'),
    social: { 
      github: 'https://github.com/PrasanthKumar-07', 
      linkedin: 'https://www.linkedin.com/in/prasanth-kumar-link' 
    }
  },
  {
    name: 'Vasamsetti Sriram',
    role: 'Backend Developer',
    roll: '23P31A1232',
    img: require('../assets/23P31A1232.jpg'),
    social: { 
      github: 'https://github.com/SriramVasamsetti', 
      linkedin: 'https://www.linkedin.com/in/sri-ram-v-35bb7b290' 
    }
  },
  {
    name: 'Pragada Vamsi',
    role: 'Backend Developer',
    roll: '23P31A12B7',
    img: require('../assets/23P31A12B7.jpeg'),
    social: { 
      github: 'https://github.com/Vamsipragada2005', 
      linkedin: 'https://www.linkedin.com/in/vamsi-pragada1750' 
    }
  },
  {
    name: 'Basa Vedhika Eshani',
    role: 'Frontend Developer',
    roll: '23P31A1202',
    img: require('../assets/23P31A1202.jpeg'),
    social: { 
      github: 'https://github.com/vedhika1202', 
      linkedin: 'https://www.linkedin.com/in/vedhika-eshani-47bb13288/' 
    }
  },
  {
    name: 'Srikakulapu Gopala Venkata Gupta',
    role: 'Database Engineer',
    roll: '23P31A12C5',
    img: require('../assets/23P31A12C5.jpeg'),
    social: { 
      github: 'https://github.com/gupta-srikakulapu', 
      linkedin: 'https://www.linkedin.com/in/gupta-srikakulapu-68bb74290/' 
    }
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
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 md:text-5xl drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            Meet the Innovators
          </h1>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto font-medium">
            The brilliant minds engineering the future of secure, AI-driven assessments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(TEAM || []).map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10, rotateY: 5, scale: 1.02 }}
              style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              className="group relative rounded-[2.5rem] border border-white/10 bg-slate-900/50 p-8 backdrop-blur-2xl shadow-2xl transition-all hover:border-orange-500/50 hover:shadow-orange-500/20"
            >
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-orange-500/0 via-transparent to-cyan-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:from-orange-500/5 group-hover:to-cyan-500/5" />
              
              <div className="relative z-10 flex flex-col items-center text-center" style={{ transform: 'translateZ(30px)' }}>
                <div className="relative mb-6 h-36 w-36 overflow-hidden rounded-full border-4 border-slate-800 bg-black/50 shadow-2xl transition-all duration-300 group-hover:border-orange-500 group-hover:scale-105">
                  <img 
                    src={member.img} 
                    alt={member.name} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                </div>
                
                <h3 className="text-xl font-black text-white group-hover:text-orange-400 transition-colors">
                  {member.name}
                </h3>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-cyan-400 mt-2">
                  {member.role}
                </p>
                <p className="text-[9px] font-bold text-zinc-600 mt-1">
                  ID: {member.roll}
                </p>
                
                <div className="mt-6 flex gap-4">
                  {member.social?.github && (
                    <a 
                      href={member.social.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="rounded-xl bg-white/5 p-3 text-zinc-500 hover:bg-white/10 hover:text-white transition-all hover:scale-110 border border-white/5"
                    >
                      <Github size={20} />
                    </a>
                  )}
                  {member.social?.linkedin && (
                    <a 
                      href={member.social.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="rounded-xl bg-white/5 p-3 text-zinc-500 hover:bg-white/10 hover:text-blue-400 transition-all hover:scale-110 border border-white/5"
                    >
                      <Linkedin size={20} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
