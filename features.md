---
layout: page
title: Features
permalink: /feat/
---

### Graph

# Domains  
The domain graph shows all of the resulting email addresses and there communication with each other. Each node is colored by domain.
![Domain Graph](../img/graph_domain.png)

### community

The community graph shows all of the resulting email addresses and there communication with each other. Each node is colored by domain.
![Community Graph](../img/graph_community.png)

### Email Table

The email tab at the bottom can be expanded and collapsed. It shows a table meta data view of the emails and can be sorted by each column. It also can be sorted in to conversations by the icon.
![Email Table](../img/email_table_01.png)


### Search

# Free Text

Free text search allows the user to search all emails and attachments for text. It is backed by elasticsearch.
![Free Text Search](../img/search_free_text.png)

# Email Address
Email Address search allows the user to search for a specific email address. This will filter the emails where this email address is in either the from/to/cc/bcc.
![Email Address Search](../img/search_email_addr.png)

### Rank

### Entities

The entities tab shows the highest occurring entities extracted by [MITIE](https://github.com/mitll/MITIE) Clicking on one of the entities will requery for emails which contain that entity.
![Entities](../img/entities.png)

### Topics

The topics tab shows the topics among all of the emails. Clicking on one of the topics will requery for all of the emails that score greater than 50% on that topic.
![Topics](../img/topics.png)


### Email View

# Active Search Recommendation

# Entities

# Mark Pertinent

# Topics

### Attachment

### Export

### Email Domains
Email Domains shows a list of all of the visible domains on the screen with the count for each along with the color. Hovering over one of the rows will highlight all of the emails for that domain in the graph
![Email Domains](../img/email_domains_highlighted.png)
