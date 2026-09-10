// NPM Modules
import React from 'react';

// Custom Modules
import './floating-request.scss';

export default class FloatingRequestButton extends React.Component {
    render() {
        return (
            <div id="floating-request-button">
                <ul>
                    <li>
                        <a
                            href="https://github.com/jared-leddy/nekuta-core/issues"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Bugs &amp; Feature Requests
                        </a>
                    </li>
                </ul>
                <button>{'\u002B'}</button>
            </div>
        );
    }
}
