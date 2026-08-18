---
title: "Pagination of API calls"
description: "With the Bitrise API, you can use pagination to iterate through list of items in the responses of certain endpoints. You can configure the properties of pagination."
sidebar_position: 3
slug: /bitrise-ci/api/pagination-of-api-calls
---

When you call an endpoint that returns a list of items, you might not get the whole list in a single response. You’ll have to iterate through the pages to retrieve all the items.

The response of such endpoints include a `paging` object, with `total_item_count` and `page_item_limit` properties. If there is a “next” page available, it’ll also include a `next` “anchor” item. For example, the response will show the app slug of the first app on the next page.

```json
{
  "data": [ ... ],
  "paging": {
    "total_item_count": 3,
    "page_item_limit": 2,
    "next": "518e869d56f2adfd"
  }
}
```

:::note[The `next` property of the `paging` object]

The `next` property of the `paging` object is only included if there’s at least one more page available. If there’s no `next` property inside `paging` that means that there’s no more page to retrieve.

:::

Limit the number of response pages with the `limit` parameter:

```
https://api.bitrise.io/v0.1/apps?limit=10
```

This call sets the `page_item_limit` property to 10. The default (and maximum) value of the parameter is 50.

Iterate through response items:

1. Call the endpoint without any pagination parameters.
1. From the response process the `paging` object.
1. If the `paging` object includes a `next` item, call the exact same endpoint with an additional `next=` query parameter, and pass the value you got in the response as the value of the `next` parameter.

**Iterating through all your registered apps**

1. Call `https://api.bitrise.io/v0.1/apps`.
1. Process the items (`data` property).
1. Check the `paging` (root) property.
1. If there’s a `next` property inside `paging`, call the endpoint again, with the `next` query parameter

   - Example: `https://api.bitrise.io/v0.1/apps?next=NEXTVALUE`, where `NEXTVALUE` is the value of the `next` property you got in your previous response.
1. Repeat this until the `paging` object does not include a `next` property, which means that the page you received was the last one.
