import { jsonEncode } from "anthelpers";
import { RelativeTime } from "datetime_global/RelativeTimeChecker";
import { Temporal } from "temporal-polyfill";
import { HeadersetUi } from "../headerset";
import { createRnameSpan, createUnameSpan } from "../createElement";
// import { context } from "@devvit/web/client";

// export class ModmailRedditUi extends HTMLElement { }
// customElements.define('favicond-reddit-comment', ModmailRedditUi);

const modmails = document.getElementById('modmails')!;
document.getElementById('ReloadModmail')!.addEventListener('click', function () {
  fetch('/api/modmailList').then(async resp => {
    if (resp.ok) {
      const { conversations } = (await resp.json());
      for (const [_convoId, convoData] of Object.entries<any>(conversations)) {
        const pre = document.createElement('pre'), textContent = jsonEncode(convoData, true);
        pre.append(Object.assign(document.createElement('code'), { textContent }));
        const div = Object.assign(document.createElement('div'), { className: 'outerdiv modmail' });
        div.setAttribute('style', 'border: 2px solid gray; margin-top: 0.5ch;padding-left: 1ch;');
        const h2 = Object.assign(document.createElement('h2'), { textContent: convoData.subject || '' });
        h2.append(' (', new RelativeTime(parseTime(convoData.lastUpdated) || new Date(NaN)), ')');
        {
          const { participant } = convoData;
          div.append(h2, new HeadersetUi({
            name: createUnameSpan(participant?.name).textContent,
            isModerator: Boolean(participant?.isMod),
            isAdmin: Boolean(participant?.isAdmin),
            isApproved: Boolean(participant?.isApproved),
            isDeleted: Boolean(participant?.isDeleted),
          }), pre);
        }
        modmails.append(div);
      }
    }
  });
});

function parseTime(instant: string): Temporal.ZonedDateTime | null {
  try {
    return Temporal.Instant.from(instant).toZonedDateTimeISO(Temporal.Now.timeZoneId());
  } catch (error) {
    console.error(error);
    return null;
  }
}

