import test from 'node:test';
import assert from 'node:assert/strict';
import {amountInRupees,inputForPriceUnit,propertyPriceRupees,storedPriceFromRupees,displayPropertyPrice} from '../src/lib/prices';
test('1000 rupees remains 1000 rupees through sale storage and display',()=>{
 const rupees=amountInRupees('1000','rupees')!;assert.equal(rupees,1000);
 const price=storedPriceFromRupees(rupees,'sale');assert.equal(price,0.01);assert.equal(propertyPriceRupees({price,purpose:'sale'}),1000);assert.equal(displayPropertyPrice({price,purpose:'sale'}),'₹1,000');
});
test('explicit lakh and crore inputs convert to the same actual INR amount',()=>{
 assert.equal(amountInRupees('75','lakh'),7500000);assert.equal(amountInRupees('1.5','crore'),15000000);
 assert.equal(amountInRupees('₹75,00,000','rupees'),7500000);
 assert.equal(amountInRupees(inputForPriceUnit(1000,'crore'),'crore'),1000);
 assert.equal(amountInRupees(inputForPriceUnit(0.01,'crore'),'crore'),0.01);
});
test('editing existing prices preserves their value and rent is monthly rupees',()=>{
 assert.equal(inputForPriceUnit(propertyPriceRupees({price:75,purpose:'sale'}),'rupees'),'7500000');
 assert.equal(displayPropertyPrice({price:25000,purpose:'rent'}),'₹25,000 / month');
 for(const input of ['', '-1000','NaN','Infinity','1e3'])assert.equal(amountInRupees(input,'rupees'),null);
});
