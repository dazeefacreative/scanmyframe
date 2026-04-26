import { motion, useTransform } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const StackCard = ({ feature, index, total, scrollYProgress }) => {
  const { isDark } = useTheme();

  const segmentSize = 1 / total;
  const holdRatio = 0.3;

  const start = index * segmentSize;
  const end = start + (segmentSize * holdRatio);

  // First card is already visible — starts at opacity 1
 const opacity = useTransform(
  scrollYProgress,
  [start, end],
  [1, 1]  
);

const y = useTransform(
  scrollYProgress,
  [start, end],
  [index === 0 ? 0 : 500, 0]  // slides up from below
);

const scale = useTransform(
  scrollYProgress,
  [start, end],
  [index === 0 ? 1 : 0.6, 1]
);

  return (
    <motion.div
      style={{
        opacity,
        y,
        scale,
        zIndex: index + 1,
        position: "absolute",
        inset: 0,
      }}
      className={`flex flex-col md:flex-row items-center gap-8 p-8 rounded-lg shadow-xl ${
        isDark ? "bg-charcoal-black text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="flex-shrink-0">
        <img
          src={feature.icon}
          alt={feature.title}
          className="h-60 w-60 md:h-80 md:w-80 object-contain"
        />
      </div>
      <div className="flex-1">
        <h3 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
          {feature.title}
        </h3>
        <div className="space-y-3">
          {feature.explanation.map((line, i) => (
            <p key={i} className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default StackCard;