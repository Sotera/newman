
drop table if exists email;

create table email (
   id varchar(1024) not null,
   threadid varchar(1024) not null,
   dir varchar(1024) not null,
   category varchar(1024) not null,
   datetime varchar(1024) not null,
   from_addr varchar(1024) not null,
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
) character set utf8;


drop table if exists entity;

create table entity (
   rownum bigint not null auto_increment,       
   subject varchar(1024) not null,
   entity_type varchar(1024) not null,
   idx int not null, 
   value varchar(1024) not null,
   created timestamp not null default current_timestamp,
   primary key (rownum)
) character set utf8;


drop table if exists tx;

create table tx (
   tx bigint not null auto_increment,       
   created timestamp not null default current_timestamp,
   primary key (tx)
) character set utf8;


drop table if exists facts;

create table facts (
   rownum bigint not null auto_increment,       
   subject varchar(1024) not null,
   schema_name varchar(1024) not null,
   predicate varchar(1024) not null,
   obj varchar(8192), 
   tx bigint not null,    
   created timestamp not null default current_timestamp,
   primary key (rownum)
) character set utf8;

drop table if exists large_text;

create table large_text (
   rownum bigint not null auto_increment,       
   subject varchar(1024) not null,
   sha512 varchar(1024),
   obj longtext not null,
   tx bigint not null,    
   created timestamp not null default current_timestamp,
   primary key (rownum)
) character set utf8;


drop table if exists `schema`;

create table `schema` (
   rownum bigint not null auto_increment,       
   schema_name varchar(1024) not null,
   predicate varchar(1024) not null,
   type varchar(1024) not null,
   cardinality char(4) not null, /* one | many */
   created timestamp not null default current_timestamp,
   primary key (rownum)
) character set utf8;
