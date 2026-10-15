import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
const p=await b.newPage({viewport:{width:1440,height:1050}});
const user={id:999999,name:'Roster fixture',email:'fixture@example.test',role:'admin'};
const place={id:1,barangay:'Pitogo',municipality:'President Carlos P. Garcia'};
const event={id:1,name:'Typhoon drill',status:'active'};
const center={id:1,name:'Central School',place,capacity:100,current:7,available:93,registered:8,first_time:8,returning:0,occupancy_percent:7,event,status:'Operational',contact:null,latest_activity:null,total_recorded_events:1,demographics:{age:{children:2,teenagers:2,adults:3},gender:{male:4,female:3},places:[{place,total:7}],puroks:[]}};
const centers=[center,{...center,id:2,name:'Covered Court'},{...center,id:3,name:'Barangay Hall'}];
let groupedReads=0;const actions=[];let childStatus="checked_in";
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(({user})=>localStorage.setItem('islasafe.session',JSON.stringify({token:'roster-fixture',user})),{user});
await p.route('**/api/**',async route=>{
const url=new URL(route.request().url());const path=url.pathname;
let body={data:[],current_page:1,last_page:1,total:0};
if(path.endsWith('/registrations/1')&&route.request().method()==='PATCH'){const action=route.request().postDataJSON();actions.push(action);childStatus=action.action==='check_out'?'checked_out':'checked_in';}
if(path.endsWith('/auth/me'))body={user};
if(path.endsWith('/centers'))body={data:centers,current_page:1,last_page:1,total:3};
if(/\/centers\/[123]$/.test(path))body={data:centers.find(c=>c.id===Number(path.split('/').at(-1)))};
if(path.endsWith('/setup'))body={data:{places:[place],event,events:[event],managers:[],assignments:[],genders:['male','female']}};
if(path.endsWith('/grouped-registrations')) {
 groupedReads++;
 body={data:['children','teens','adults'].map((age,i)=>({key:age,title:['Children','Teens','Adults'][i],range:['0-12 years','13-17 years','18 years and above'][i],total:i===0?27:2,genders:['male','female'].map((gender,j)=>({key:gender,title:gender==='male'?'Male':'Female',page_key:age+'_'+gender+'_page',total:i===0&&j===0?26:1,current_page:Number(url.searchParams.get(age+'_'+gender+'_page')||1),last_page:i===0&&j===0?2:1,data:url.searchParams.get('q')==='Missing'?[]:[{id:i*2+j+1,evacuee_id:100+i*2+j,full_name:(i===0&&j===0&&url.searchParams.get('children_male_page')==='2')?'Next child':`${age} ${gender} person`,age:[8,15,60][i],age_group:age,gender,place,purok:'Purok 1',status:i===0&&j===0?childStatus:'checked_in',registered_at:'2026-10-15T08:00:00Z'}]}))})),total:31,event,places:[place]};
 if(url.searchParams.get('q')==='Missing'){body.total=0;body.data.forEach(g=>{g.total=0;g.genders.forEach(s=>{s.total=0;s.last_page=1})})}
}
await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
await p.goto('http://localhost:5173');
await p.getByRole('button',{name:'Evacuation Centers',exact:true}).click();
const directory=p.getByLabel('Evacuation center directory');await directory.waitFor();
assert.equal(await directory.locator('.evac-card').count(),3);
assert.equal(await p.locator('.live-map').count(),0);
assert.equal(await directory.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),3);
await mkdir('../.verification/evacuation-grid',{recursive:true});
await p.screenshot({path:'../.verification/evacuation-grid/directory.png'});
await p.getByRole('button',{name:'View evacuees at Central School',exact:true}).click();
const dialog=p.getByRole('dialog',{name:'Central School',exact:true});await dialog.waitFor();
for(const age of ['Children','Teens','Adults'])for(const gender of ['Male','Female'])await dialog.getByRole('region',{name:age+' - '+gender,exact:true}).getByText(`${age.toLowerCase()} ${gender.toLowerCase()} person`,{exact:true}).waitFor();
await p.screenshot({path:'../.verification/evacuation-grid/grouped-roster.png'});
const child=dialog.getByRole('region',{name:'Children - Male',exact:true});
await child.getByRole('button',{name:'Check out',exact:true}).click();
await child.getByRole('button',{name:'Check in',exact:true}).waitFor();
await child.getByRole('button',{name:'Check in',exact:true}).click();
await child.getByRole('button',{name:'Check out',exact:true}).waitFor();
await dialog.getByText('Transfer an evacuee to another center',{exact:true}).click();
await dialog.getByRole('combobox',{name:'Transfer destination',exact:true}).selectOption('2');
await child.getByRole('button',{name:'Transfer',exact:true}).click();
await p.waitForTimeout(500);
assert.deepEqual(actions,[{action:'check_out'},{action:'check_in'},{action:'transfer',center_id:2}]);

await dialog.getByRole('navigation',{name:'Children Male pages',exact:true}).getByRole('button',{name:'Next',exact:true}).click();
await dialog.getByText('Next child',{exact:true}).waitFor();
assert.equal(await dialog.getByRole('region',{name:'Teens - Female',exact:true}).getByText('teens female person',{exact:true}).count(),1);
await dialog.getByLabel('Search center roster').fill('Missing');
await dialog.getByText('No registered evacuees match these filters.',{exact:true}).waitFor();
await dialog.getByLabel('Search center roster').fill('');await dialog.getByText('children male person',{exact:true}).waitFor();
await p.setViewportSize({width:390,height:844});await dialog.evaluate(el=>{el.scrollTop=0});
await p.screenshot({path:'../.verification/evacuation-grid/grouped-roster-mobile.png'});
assert.equal(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),true);assert.equal(await dialog.evaluate(el=>getComputedStyle(el).overflowY),'auto');assert.equal(await dialog.evaluate(el=>el.getBoundingClientRect().x>0),true);
await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
await p.setViewportSize({width:1440,height:1050});
await p.getByRole('button',{name:'View evacuees at Covered Court',exact:true}).focus();await p.keyboard.press('Enter');
await p.getByRole('dialog',{name:'Covered Court',exact:true}).waitFor();
assert.deepEqual(errors,[]);console.log(JSON.stringify({gridColumns:3,ageGenderLists:6,independentPagination:true,search:true,keyboardCardActivation:true,responsive:true,registrationActions:actions,groupedReads,errors}));
} finally {await b.close();}
