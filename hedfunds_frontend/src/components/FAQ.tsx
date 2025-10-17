import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  title: string;
  contents: string[];
  rotate: string;
  lastCard: boolean;
  index: number;
}

const Card: React.FC<CardProps> = ({ title, contents, rotate, lastCard, index }) => (
  <motion.div
    className={`bg-white rounded-2xl p-10 min-h-[300px] shadow-md w-full max-w-xl mx-auto ${rotate}`}
    initial={{
      opacity: 0,
      y: 50 * (index + 1),
      scale: 0.95,
      rotateY: 10 * (index % 2 === 0 ? 1 : -1),
    }}
    whileInView={{
      opacity: 1,
      y: 0,
      scale: 1,
    }}
    transition={{
      duration: 0.6,
      delay: 0.2 * index,
    }}
  >
    <h2 className="text-xl font-bold mb-6 leading-relaxed">{title}</h2>
    <ul className="list-disc pl-5 space-y-2 leading-relaxed">
      {contents.map((content, idx) => (
        <li key={idx}>{content}</li>
      ))}
    </ul>
    {lastCard && (
      <div className="mt-4 text-sm italic text-gray-500"></div>
    )}
  </motion.div>
);

const FAQ: React.FC = () => {
  const cardData: CardProps[] = [
    {
      title: "What is Swiftfund ?",
      contents: [
        "Swiftfund is a decentralized platform that lets people borrow and lend money directly with each other using blockchain technology. No banks, no middlemen — just fast, fair loans secured by smart contracts on Cardano."
      ],
      rotate: "rotate-2",
      lastCard: false,
      index: 0,
    },
    {
      title: "How is it different from traditional lending?",
      contents: [
        "Unlike banks or loan apps that require paperwork, collateral, or charge high fees, Swiftfund works purely on trust scores and blockchain automation. That means no delays, no bias — and full transparency."
      ],
      rotate: "-rotate-2",
      lastCard: false,
      index: 1,
    },
    {
      title: "How do smart contracts work in Swiftfund?",
      contents: [
        "When a loan is funded, the smart contract holds the funds and sets conditions for repayment. If the borrower repays in time, the contract sends the lender their money back with interest. If not, the borrower’s reputation score drops."
      ],
      rotate: "rotate-4",
      lastCard: false,
      index: 2,
    },
    {
      title: "What is a reputation score and how is it calculated?",
      contents: [
        "It’s a decentralized trust rating based on your actions on Swiftfund — like timely repayment, successful loans funded, or bad behavior (missed payments, scams). The better your score, the more people will want to lend to you."
      ],
      rotate: "-rotate-4",
      lastCard: false,
      index: 3,
    },
    {
      title: "Do I need to stake or lock in funds to use Swiftfund?",
      contents: [
        "No staking is required to get started. But once you decide to fund a loan, your funds will be temporarily locked in a smart contract until the loan is complete."
      ],
      rotate: "rotate-2",
      lastCard: false,
      index: 4,
    },
    {
      title: "Can I make money with Swiftfund?",
      contents: [
        "Yes. Lenders earn interest when loans are repaid. Borrowers benefit from quick access to funds. It’s a win-win when everyone plays fair."
      ],
      rotate: "-rotate-2",
      lastCard: true,
      index: 5,
    },
  ];

  return (
    <div className="bg-secondary min-h-dvh h-full relative w-full sm:px-10 px-5 py-[93px]">
      <div className="relative flex h-full flex-col gap-[30vh] mt-[50px]">
        {cardData.map((card, idx) => (
          <div key={idx} className="sticky top-40">
            <Card
              title={card.title}
              contents={card.contents}
              rotate={card.rotate}
              index={idx}
              lastCard={idx === cardData.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;