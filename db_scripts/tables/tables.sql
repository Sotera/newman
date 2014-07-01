
drop table if exists email;

create table email (
   id varchar(1000) not null,
   threadid varchar(1000) not null,
   dir varchar(1000) character set utf8 not null,
   category varchar(1000) character set utf8 not null,
   datetime varchar(1000) not null,
   from_addr varchar(1000) character set utf8 not null,
   tos mediumtext,
   ccs mediumtext,
   bccs mediumtext,
   subject mediumtext,
   body longtext,
   tosize smallint,
   ccsize smallint,
   bccsize smallint, 
   attachsize smallint,
   attach mediumtext,
   bodysize smallint,
   location mediumtext
);

drop table if exists email_addr;

create table email_addr (
   rownum bigint not null auto_increment,       
   community varchar(1000) not null,
   rank varchar(1000) not null,
   group_id varchar(1000) not null,
   community_id varchar(1000) not null,
   primary key (rownum)   
);

drop table if exists xref_recipients;

create table xref_recipients(
   `from` varchar(1000) not null,   
   recipient varchar(1000) not null,   
   `type` varchar(1000) not null,   
   email_id varchar(1000) not null
);

drop table if exists xref_entity_email;

create table xref_entity_email(
   `from` varchar(1000) not null,   
   recipient varchar(1000) not null,   
   `type` varchar(1000) not null,   
   email_id varchar(1000) not null
);

drop table if exists xref_emailaddr_email;

create table xref_emailaddr_email (
   `from` varchar(1000) not null,   
   recipient varchar(1000) not null,   
   `type` varchar(1000) not null,   
   email_id varchar(1000) not null
);


drop table if exists entity;

create table entity (
   rownum bigint not null auto_increment,       
   subject varchar(1000) not null,
   entity_type varchar(1000) not null, 
   idx int not null, 
   value varchar(1000) character set utf8 not null,
   email_id varchar(1000) not null,
   created timestamp not null default current_timestamp,
   primary key (rownum)
) ENGINE=MyISAM;

drop table if exists entity_rollup;

create table entity_rollup (
   subject varchar(1000) not null,
   `type` varchar(1000) not null,
   val varchar(8192) not null,
   total_entities int not null,
   total_emails int not null,
   primary key (subject)
) ENGINE=MyISAM;

drop table if exists tx;

create table tx (
   tx bigint not null auto_increment,       
   created timestamp not null default current_timestamp,
   primary key (tx)
) ENGINE=MyISAM;


drop table if exists facts;

create table facts (
   rownum bigint not null auto_increment,       
   subject varchar(1000) not null,
   schema_name varchar(256) not null,
   predicate varchar(512) not null,
   obj varchar(8192) character set utf8, 
   tx bigint not null,    
   created timestamp not null default current_timestamp,
   primary key (rownum)
) ENGINE=MyISAM;

drop table if exists large_text;

create table large_text (
   rownum bigint not null auto_increment,       
   subject varchar(1000) not null,
   sha512 varchar(1000),
   obj longtext character set utf8 not null,
   tx bigint not null,    
   created timestamp not null default current_timestamp,
   primary key (rownum)
) ENGINE=MyISAM;


drop table if exists `schema`;

create table `schema` (
   rownum bigint not null auto_increment,       
   schema_name varchar(256) not null,
   predicate varchar(512) not null,
   type varchar(1000) not null,
   cardinality char(4) not null, /* one | many */
   created timestamp not null default current_timestamp,
   primary key (rownum)
) ENGINE=MyISAM;


