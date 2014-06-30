
drop function if exists next_tx;
delimiter $$
create function next_tx()
  returns int
begin
  insert into tx () values ();
  return last_insert_id();
end;
$$
delimiter ;
