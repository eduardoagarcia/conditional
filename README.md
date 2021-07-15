# Conditional Pal
#### Create complex conditionals within Blackbaud's Luminate CRM

## Overview:
Ever wanted to write really complex, nested Luminate Conditionals with `&&` and `||` that test for cool stuff like `<`, `>=`, `^`, or even `$`?

Now you can.  With Conditional Pal, you can write logic that is visually more traditional in syntax and then convert it to our beloved Luminate Conditional syntax.

## Example:

The tool translates:

```javascript
if (2 <= 2) {
    two is less than or equal to two
}
```

to:

```
[[?x1x::x[[E130: 2 2 < 2 2 == ||]]x::
    two is less than or equal to two
::]]
```

## Operations:

The following operations are supported:

* Equals (`==`)
* Not equal to (`!=`)
* Greater than (`>`)
* Greater than or equal to (`>=`)
* Less than (`<`)
* Less than or equal to (`<=`)
* Contains (`*`)
* Starts with (`^`)
* Ends with (`$`)

## Logicals:

The tool also supports both the logical AND (`&&`) and the logical OR (`||`).  For example, wrap your conditional statements in parentheses to give precedence using logicals:

```javascript
if (5 != 5 || (1 < 2 && 3 > 2)) {
    parentheses in action
}
```

Result:

```
[[?x1x::x[[?[[?x5x::x5x::0::1]][[?x[[E130: 1 2 <]][[E130: 3 2 >]]x::x11x::1::0]]::1::1::0]]x::
    parentheses in action
::]]
```

## Nesting:

Nest your conditionals if you need:

```javascript
if (foo != bar) {
    if (foo == foo) {
        foo equals foo
    }
}
```

Result:

```
[[?x1x::x[[?xfoox::xbarx::0::1]]x::
    [[?x1x::x[[?xfoox::xfoox::1::0]]x::
        foo equals foo
    ::]]
::]]
```

## Utilize else statements:

```javascript
if (dog == cat) {
    weird...
} else {
    dogs are not cats!
}
```

Result:

```
[[?x1x::x[[?xdogx::xcatx::1::0]]x::
    weird...
::
    dogs are not cats!
]]
```

## Additional Notes and Warnings:

* Use at your own risk.  I have tested thoroughly, but test before you use on a client's site.
* Some of the conditionals, especially the basic ones, are probably more complex than a human would write—this is due to the way the tool uses 1s and 0s as true/false.  Feel free to simplify if you need to, or even learn from the tool to write your own complex conditionals.
* The conditionals will get very intense very quick, so be aware.
* Don't go crazy wrapping with unnecessary parentheses.  As long as you close all open parentheses, it will return valid logic.  Example: `(((((1>2)))))` will return a working conditional, albeit quite strangely wrapped in extras that aren't needed.  Instead, use `(1>2)` or even `1>2` to keep things simple.
* You can't use `&&` and `||` within the same set of parentheses.  The following example will not work and the `&&` will be ignored: `(1>2 || 3<5 || a!=b && z==x || 1 * 1)`.  The tool uses the first logical as the logical type to be used within the parentheses.
* Garbage In gives you Garbage Out.  While the tool does have syntax error checking, if you give it garbage, it will give you garbage in return.

## Notes:

More examples plus a full reference (with examples as well) are built into the tool.
