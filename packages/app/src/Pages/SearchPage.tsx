import { useIntl, FormattedMessage } from "react-intl";
import { useParams } from "react-router-dom";
import Timeline from "Element/Timeline";
import { Tab, TabElement } from "Element/Tabs";
import { useEffect, useState } from "react";
import { debounce } from "Util";
import { router } from "index";
import { SearchRelays } from "Const";
import { System } from "System";

import messages from "./messages";

const POSTS = 0;
const PROFILES = 1;

const SearchPage = () => {
  const params = useParams();
  const { formatMessage } = useIntl();
  const [search, setSearch] = useState<string>();
  const [keyword, setKeyword] = useState<string | undefined>(params.keyword);
  const [sortPopular, setSortPopular] = useState<boolean>(true);
  // tabs
  const SearchTab = {
    Posts: { text: formatMessage(messages.Posts), value: POSTS },
    Profiles: { text: formatMessage(messages.People), value: PROFILES },
  };
  const [tab, setTab] = useState<Tab>(SearchTab.Posts);

  useEffect(() => {
    if (keyword) {
      // "navigate" changing only url
      router.navigate(`/search/${encodeURIComponent(keyword)}`);
    }
  }, [keyword]);

  useEffect(() => {
    return debounce(500, () => setKeyword(search));
  }, [search]);

  useEffect(() => {
    const addedRelays: string[] = [];
    for (const [k, v] of SearchRelays) {
      if (!System.Sockets.has(k)) {
        System.ConnectToRelay(k, v);
        addedRelays.push(k);
      }
    }
    return () => {
      for (const r of addedRelays) {
        System.DisconnectRelay(r);
      }
    };
  }, []);

  function tabContent() {
    if (!keyword) return null;
    const pf = tab.value == PROFILES;
    return (
      <>
        {sortOptions()}
        <Timeline
          key={keyword + (pf ? "_p" : "")}
          subject={{
            type: pf ? "profile_keyword" : "post_keyword",
            items: [keyword + (sortPopular ? " sort:popular" : "")],
            discriminator: keyword,
          }}
          postsOnly={false}
          noSort={pf && sortPopular}
          method={"LIMIT_UNTIL"}
        />
      </>
    );
  }

  function sortOptions() {
    if (tab.value != PROFILES) return null;
    return (
      <div className="flex mb10 f-end">
        <FormattedMessage defaultMessage="Sort" description="Label for sorting options for people search" />
        &nbsp;
        <select onChange={e => setSortPopular(e.target.value == "true")} value={sortPopular ? "true" : "false"}>
          <option value={"true"}>
            <FormattedMessage defaultMessage="Popular" description="Sort order name" />
          </option>
          <option value={"false"}>
            <FormattedMessage defaultMessage="Recent" description="Sort order name" />
          </option>
        </select>
      </div>
    );
  }

  function renderTab(v: Tab) {
    return <TabElement key={v.value} t={v} tab={tab} setTab={setTab} />;
  }

  return (
    <div className="main-content">
      <h2>
        <FormattedMessage {...messages.Search} />
      </h2>
      <div className="flex mb10">
        <input
          type="text"
          className="f-grow mr10"
          placeholder={formatMessage(messages.SearchPlaceholder)}
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus={true}
        />
      </div>
      <div className="tabs">{[SearchTab.Posts, SearchTab.Profiles].map(renderTab)}</div>
      {tabContent()}
    </div>
  );
};

export default SearchPage;
