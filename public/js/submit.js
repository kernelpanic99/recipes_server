$(document).ready(function () {

    let die_count = 1;

    let actions = [];

    $('#dir-add').click(function (e) {
        let act = $('<div>', {
            class: 'control',
            css: {
                display: 'flex',
                'flex-direction': 'row',
                padding: '20 0'
            },
            append: [
                $('<h1>', {
                    class: 'title is-1',
                    text: die_count,
                    css: {
                        padding: 10,
                        display: 'inline'
                    }
                }),
                $('<textarea>', {
                    id: 'action' + die_count,
                    class: 'textarea',
                    rows: 3,
                    css: {
                        'resize': 'none',
                        'min-width': 'auto'
                    },
                    placeholder: 'enter action here',
                })
            ]
        });

        $('#directions').append(act);
        die_count++;
        actions.push(act);
    });

    $('#dir-pop').click(function () {
        if (actions.length != 0) {
            actions.pop().remove();
            die_count--;
        }
    });

    $('form').submit(function (e) {
        e.preventDefault();

        let act = []

        for (a of actions) {
            action = {};

            action.order = a.find('h1').text();
            action.description = a.find('textarea').val();
            act.push(action);
        }

        let recipe = {
            name: $('#name').val(),
            brief: $('#brief').val(),
            description: $('#description').val(),
            ingridients: $('#ingridients').val().split(','),
            actions: act
        };

        fetch('/user/submit', {
            method: 'post',
            body: JSON.stringify(recipe),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }).then(s => console.log(s)).catch(e => console.log(e));
    });
});