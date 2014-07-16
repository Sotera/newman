
DELIMITER $$

drop procedure if exists drop_index_if_exists $$
create procedure drop_index_if_exists(in thetable varchar(128), in theindexname varchar(128) )
begin
 if((select count(*) as index_exists from information_schema.statistics where table_schema = database() and table_name =
thetable and index_name = theindexname) > 0) then
   set @s = concat('drop index ' , theindexname , ' on ' , thetable);
   prepare stmt from @s;
   execute stmt;
 end if;
end $$

delimiter ;


call drop_index_if_exists('facts', 'idx_facts_subject');
call drop_index_if_exists('facts', 'idx_facts_schema');
call drop_index_if_exists('facts', 'idx_facts_schema_pred');
call drop_index_if_exists('facts', 'idx_facts_pred');
call drop_index_if_exists('facts', 'idx_facts_obj');
call drop_index_if_exists('facts', 'idx_facts_tx');

create index idx_facts_subject on facts (subject(1000));
create index idx_facts_schema on facts(schema_name);
create index idx_facts_schema_pred on facts(schema_name, predicate);
create index idx_facts_pred on facts(predicate);
create index idx_facts_obj on facts(obj(8192));
create index idx_facts_tx on facts(tx);

call drop_index_if_exists('email', 'idx_email_id');
call drop_index_if_exists('email', 'idx_email_line_num');

create index idx_email_id on email(id);
create index idx_email_line_num on email(line_num);

call drop_index_if_exists('entity', 'idx_entity_subject');
call drop_index_if_exists('entity', 'idx_entity_type');
call drop_index_if_exists('entity', 'idx_entity_val');

create index idx_entity_subject on entity(subject);
create index idx_entity_type on entity(entity_type);
create index idx_entity_val on entity(value);

call drop_index_if_exists('xref_recipients', 'idx_xref_recipients_from');
call drop_index_if_exists('xref_recipients', 'idx_xref_recipients_recipient');
call drop_index_if_exists('xref_recipients', 'idx_xref_recipients_email');

create index idx_xref_recipients_from on xref_recipients(`from`);
create index idx_xref_recipients_recipient on xref_recipients(recipient);
create index idx_xref_recipients_email on xref_recipients(email_id);

call drop_index_if_exists('xref_entity_email', 'idx_xref_entity_email_ids');
call drop_index_if_exists('xref_entity_email', 'idx_xref_entity_email_rollup');
call drop_index_if_exists('xref_entity_email', 'idx_xref_entity_email_email');

create index idx_xref_entity_email_ids on xref_entity_email(rollup_id, email_id);
create index idx_xref_entity_email_rollup on xref_entity_email(rollup_id);
create index idx_xref_entity_email_email on xref_entity_email(email_id);

call drop_index_if_exists('xref_emailaddr_email', 'idx_xref_emailaddr_email_addr_id');
call drop_index_if_exists('xref_emailaddr_email', 'idx_xref_emailaddr_email_addr');
call drop_index_if_exists('xref_emailaddr_email', 'idx_xref_emailaddr_email_id');

create index idx_xref_emailaddr_email_addr_id on xref_emailaddr_email(email_addr, email_id);
create index idx_xref_emailaddr_email_addr on xref_emailaddr_email(email_addr);
create index idx_xref_emailaddr_email_id on xref_emailaddr_email(email_id);

call drop_index_if_exists('xref_rollup_entity', 'idx_xref_emailaddr_email_addr_id');
call drop_index_if_exists('xref_rollup_entity', 'idx_xref_emailaddr_email_addr');
call drop_index_if_exists('xref_rollup_entity', 'idx_xref_emailaddr_email_id');

create index idx_xref_rollup_entity_rollup_entity on xref_rollup_entity(rollup_id, entity_id);
create index idx_xref_rollup_entity_rollup on xref_rollup_entity(rollup_id);
create index idx_xref_rollup_entity_entity on xref_rollup_entity(entity_id);


call drop_index_if_exists('topic_category', 'idx_topic_category_id');

create index idx_topic_category_id on topic_category(category_id);


call drop_index_if_exists('xref_email_topic_score', 'idx_xref_email_topic_score_email');
call drop_index_if_exists('xref_email_topic_score', 'idx_xref_email_topic_score_email_category');
call drop_index_if_exists('xref_email_topic_score', 'idx_xref_email_topic_score_category');

create index idx_xref_email_topic_score_email on xref_email_topic_score(email_id);
create index idx_xref_email_topic_score_email_category on xref_email_topic_score(category_id, email_id);
create index idx_xref_email_topic_score_category on xref_email_topic_score(category_id);


drop procedure if exists drop_index_if_exists;
