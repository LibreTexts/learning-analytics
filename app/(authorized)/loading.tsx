import Image from "next/image";

export default function Loading() {
  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-align-center">
      <Image
        src="https://cdn.libretexts.net/Icons/libretexts.png"
        alt="LibreTexts Logo"
        width={400}
        height={400}
      />
      <div className="tw-flex tw-space-x-6 tw-justify-center tw-items-center tw-mt-8">
        <div className="tw-h-8 tw-w-8 tw-bg-libre-blue tw-rounded-full tw-animate-bounce"></div>
        <div className="tw-h-8 tw-w-8 tw-bg-libre-blue tw-rounded-full tw-animate-bounce ![animation-delay:-0.15s]"></div>
        <div className="tw-h-8 tw-w-8 tw-bg-libre-blue tw-rounded-full tw-animate-bounce"></div>
      </div>
    </div>
  );
}
