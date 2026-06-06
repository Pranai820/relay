export const QUICK_DEFAULTS = {
  GITHUB_LIST_REPOSITORIES_FOR_THE_AUTHENTICATED_USER: {
    sort: "updated",
    direction: "desc",
    per_page: 30,
    page: 1,
  },
  GITHUB_SEARCH_ISSUES_AND_PULL_REQUESTS: {
    q: "assignee:@me is:open",
    per_page: 20,
    page: 1,
    order: "desc",
  },
  GITHUB_LIST_REPOSITORY_ISSUES: {
    state: "open",
    sort: "created",
    direction: "desc",
    per_page: 30,
    page: 1,
  },
  GITHUB_LIST_PULL_REQUESTS: {
    state: "open",
    sort: "created",
    direction: "desc",
    per_page: 30,
    page: 1,
  },
  GITHUB_GET_PAGE_VIEWS: {
    per: "day",
  },
  GMAIL_FETCH_EMAILS: {
    user_id: "me",
    query: "is:unread in:inbox",
    max_results: 20,
    verbose: true,
    include_payload: true,
  },
  GMAIL_SEND_EMAIL: {
    user_id: "me",
  },
  GMAIL_CREATE_EMAIL_DRAFT: {
    user_id: "me",
  },
  GMAIL_REPLY_TO_THREAD: {
    user_id: "me",
  },
  GOOGLECALENDAR_EVENTS_LIST: {
    calendarId: "primary",
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  },
  GOOGLECALENDAR_FIND_EVENT: {
    calendar_id: "primary",
    single_events: true,
    max_results: 25,
  },
  GOOGLECALENDAR_CREATE_EVENT: {
    calendar_id: "primary",
    event_duration_minutes: 30,
    event_duration_hour: 0,
    create_meeting_room: true,
  },
  GOOGLECALENDAR_LIST_CALENDARS: {
    max_results: 50,
  },
  NOTION_SEARCH_NOTION_PAGE: {
    query: "",
    filter_value: "page",
    page_size: 25,
  },
  NOTION_FETCH_DATA: {
    fetch_type: "all",
    page_size: 50,
  },
  NOTION_QUERY_DATABASE: {
    page_size: 25,
  },
  NOTION_CREATE_NOTION_PAGE: {},
  NOTION_ADD_MULTIPLE_PAGE_CONTENT: {
    content_blocks: [{ block_property: "paragraph", content: "" }],
  },
  NOTION_QUERY_DATABASE_WITH_FILTER: {
    page_size: 25,
  },
  NOTION_UPDATE_ROW_DATABASE: {
    delete_row: false,
  },
  NOTION_FETCH_ROW: {},
};

export function mergeQuickArgs(toolSlug, args = {}) {
  const defaults = QUICK_DEFAULTS[toolSlug] || {};
  return { ...defaults, ...args };
}
