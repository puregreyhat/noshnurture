import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="w-[130px] h-[130px] flex justify-center items-center relative">
        <Image
          src="/logo.png"
          alt="Loading"
          width={100}
          height={100}
          className="animate-float-glow"
          priority
        />
      </div>
    </div>
  );
}
