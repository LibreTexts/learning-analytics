import Image from "next/image";

const NoCourseData = () => {

    return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full">
            <Image
                src="https://cdn.libretexts.net/Icons/libretexts.png"
                alt="LibreTexts Logo"
                width={400}
                height={400}
            />
            <h2 className="tw-font-semibold">No Data Yet</h2>
            <p>
                We are currently collecting data for this course or there may be no data available. Please check back later!
            </p>
            <p>
                If you have just created this course, please ensure that you have added assignments to it and that students have begun submitting their work.
            </p>
        </div>
    )
}

export default NoCourseData;