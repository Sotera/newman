
truncate table `schema`;

/*
  TYPES:
    string - any string 
    date - date that is properly formatted
    number - any number field
    geo - [decimal lat]|[decimal lon]
    ref - refrence to another type
*/

/** email **/
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'id', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'threadid', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'dir', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'category', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'datetime', 'date', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'from', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'tos', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'to', 'string', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'ccs', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'cc', 'string', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'bccs', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'bcc', 'string', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'subject', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'body', 'ref_large_text', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'tosize', 'number', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'ccsize', 'number', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'attachsize', 'number', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'bodysize', 'number', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email', 'location', 'string', 'one');

/** email_addr **/
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'to', 'string', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'community', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'cc', 'string', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'bcc', 'string', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'total_recipients', 'number', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'total_received', 'number', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'sent_time', 'date', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'received_time', 'date', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'group_id', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'community_id', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('email_addr', 'email', 'ref_email', 'many');

/** entity **/
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity', 'value', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity', 'type', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity', 'idx', 'number', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity', 'email', 'ref_email', 'one');

/** entity_rollup **/
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity_rollup', 'value', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity_rollup', 'type', 'string', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity_rollup', 'entity', 'ref_entity', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity_rollup', 'email', 'ref_email', 'many');
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity_rollup', 'total_entities', 'number', 'one');
insert into `schema` (schema_name, predicate, type, cardinality) values ('entity_rollup', 'total_emails', 'number', 'one');

commit;
