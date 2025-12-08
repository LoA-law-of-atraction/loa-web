"use client";

import PropTypes from "prop-types";

const LegalDocs = ({ mou }) => {
  return (
    <article className="flex flex-col self-start my-6 text-white">
      <ol className="list-decimal list-inside flex flex-col gap-6 text-white/90">
        {mou.map((item) => (
          <li key={item.id} className="space-y-3">
            {item.title && (
              <h2 className="text-lg inline font-semibold">{item.title}</h2>
            )}
            <p className="mt-2">{item.text}</p>
            {item.list && (
              <ul className="list-disc list-inside mt-3 ml-4 space-y-1">
                {item.list.map((listItem) => (
                  <li key={listItem}>{listItem}</li>
                ))}
              </ul>
            )}
            {item.addition && <p className="mt-3">{item.addition}</p>}
            {item.subtext && <p className="mt-3 font-medium">{item.subtext}</p>}
            {item.subtext2 && <p className="mt-2">{item.subtext2}</p>}
            {item.subtext3 && (
              <p className="mt-3 font-medium">{item.subtext3}</p>
            )}
            {item.subtext4 && <p className="mt-2">{item.subtext4}</p>}
            {item.subtext5 && (
              <p className="mt-3 font-medium">{item.subtext5}</p>
            )}
            {item.subtext6 && <p className="mt-2">{item.subtext6}</p>}
            {item?.sublist && (
              <ul className="list-disc list-inside ml-4 mt-3 space-y-1">
                {item.sublist.map((subItem) => (
                  <li key={subItem}>{subItem}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
};

LegalDocs.propTypes = {
  mou: PropTypes.array.isRequired,
};

export default LegalDocs;
