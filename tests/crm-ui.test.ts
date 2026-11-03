import test from 'node:test';
import assert from 'node:assert/strict';
import {seedWorkspace} from '../src/lib/seed';
import {renderUI} from './helpers/render-ui';
test('CRM previews stay private and listing status is available in the portfolio',()=>{
 const html=renderUI('src/components/crm.tsx','CRM',{section:'properties'},seedWorkspace());
 assert.ok(html.includes('href="/app/properties/p1"'));assert.ok(!html.includes('?property='));assert.ok(html.includes('aria-label="Status for The Palm Residences"'));assert.match(html,/>Sold<\/option>/);
});
test('lead CRM has stages and lead details have a direct call link',()=>{
 const workspace=seedWorkspace(),html=renderUI('src/components/crm.tsx','CRM',{section:'leads'},workspace);
 assert.ok(html.includes('aria-label="Lead stage for Aarav Shah"'));assert.ok(html.includes('href="tel:9876543210"'));
 const details=renderUI('src/features/leads/lead-details.tsx','LeadDetails',{leadId:'l1',onClose(){},onEdit(){}},workspace);
 assert.ok(details.includes('Lead details'));assert.ok(details.replace(/<!--.*?-->/g,'').includes('Call Aarav'));assert.ok(!details.includes('Edit lead'));
});
test('contact permission starts checked and overview includes full specifications',()=>{
 const workspace=structuredClone(seedWorkspace());workspace.properties[0].societyName='Garden Court';workspace.properties[0].floorNumber=4;workspace.properties[0].totalFloors=12;
 const contact=renderUI('src/components/storefront.tsx','ContactDialog',{mode:'enquiry',onClose(){},onDone(){}},workspace);
 assert.match(contact,/type="checkbox"[^>]*checked/);
 const overview=renderUI('src/components/property-overview.tsx','PropertyOverview',{property:workspace.properties[0],internal:true},workspace);
 for(const text of ['Carpet area','Garden Court','Floor number','Total floors','Furnishing','Listing status','Amenities','No photo uploaded'])assert.ok(overview.includes(text),text);
});
